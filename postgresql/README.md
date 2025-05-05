# Mastering PostgreSQL

Postgres 

## Data Types

PostgreSQL supports a wide range of data types, including:

| Data Type | Bytes | Description | Notes |
| --------- | ----- | ----------- | ----- |
| `INT2` | 2 | Small integer | -32,768 to 32,767 |
| `INT4` | 4 | Integer | -2,147,483,648 to 2,147,483,647 |
| `INT8` | 8 | Big integer | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |
| `NUMERIC(<precision>, <scale>)` | variable | Arbitrary precision number | |
| `REAL` | 4 | Single precision floating point | 1E-37 to 1E37 at least 6 digit after the decimal point |
| `DOUBLE PRECISION` | 8 | Double precision floating point | 1E-307 to 1E308 at least 15 digits after the decimal point |
| `CHAR(n)` | n | Fixed-length character string | Blank-padded |
| `VARCHAR(<n>)` | n | Variable-length character string | No blank padding |
| `TEXT` | variable | Variable-length character string | No blank padding, often used with TOAST table |
| `TIMESTAMP(<fractional seconds>)` | 8 | Date and time without time zone | |
| `TIMESTAMP WITH TIME ZONE` | 8 | Date and time with time zone | |
| `JSON` | variable | JSON data | |
| `JSONB` | variable | Binary JSON data | |
| `UUID` | 16 | Universally unique identifier | |

_The list is not exhaustive and there are many other data types available in PostgreSQL._

It worth to mention that:  
- `UNSIGNED` integers are not supported in PostgreSQL
- Integer are faster than other numeric types
- `NUMERIC` is slower than floating point and integer types
- `NUMERIC` are precise than floating point types
- All the string types are the same thing under the hood and there is no performance difference between them
- Timestamp with timezone is the default type for `TIMESTAMP` in PostgreSQL
- Timestamp without timezone: Postgres makes no efforts to do any conversion at all. With a timestamp, with time zone, what it's going to do is it's going to take the value that you give it, convert it to UTC to store it in the database, then when you pull it back out, it's going to convert it to whatever time zone you are in. In general, the suggestion is to use `TIMESTAMP WITH TIME ZONE` unless you have a good reason not to
- When casting a timestamp to a lower precision, the fractional seconds are rounded, so it could return a date in the future
- When a new timestamp data is being inserted and it does not have a timezone, Postgres will assume that the timestamp is in the current timezone of the database
- `SELECT NULL = NULL;` returns `NULL`, while `SELECT NULL IS NULL;` returns `TRUE`. This is because `NULL` is not equal to anything, not even itself. The `IS NULL` operator is used to check for `NULL` values. This implies that `UNIQUE` constraints will not work with `NULL` values if the column is nullable! It is possible to set a colum `unique nulls not distinct` to allow a single `NULL` value in a column with a unique constraint.

### Data Types playground

```sql
-- NUMERIC/DECIMAL
SELECT 12.345::numeric(5,3); -- OK
SELECT 12.345::numeric(2,3); -- ERROR: numeric field overflow
SELECT 12.345::numeric(5,2); -- OK: 12.35

-- 5 is the significant UNROUNDED digits
SELECT 1234567.345::numeric(5,-2); -- OK: 1234600

-- FLOAT
SELECT 7.0::float8 * (2.0 / 10.0); -- Inprecise: 1.4000000000000001
SELECT 7.0::numeric * (2.0 / 10.0); -- OK: 1.40000000

-- Speed Comparison
SELECT sum(num::numeric/(num+1))::numeric
FROM generate_series(1, 20000000) num;
-- ~5.0 seconds

SELECT sum(num::float8/(num+1))::float8
FROM generate_series(1, 20000000) num;
-- ~2.5 seconds

-- Different ways to cast:
SELECT
	pg_typeof(100::int8), -- :: postgres operator syntax only
  pg_typeof(integer '100'), -- [Decorated literal] syntax
	pg_typeof(cast(100 as numeric)); -- portable syntax

-- TIMESTAMP
SELECT
  now()::timestamptz(2), -- alias for `timestamp with time zone`
  now()::timestamp(2), -- note that the rounding could return a date in the future
  date_trunc('second', now());
-- The output is ISO 8601 format

SHOW DateStyle; -- ISO, MDY [The first part is the output format, the second part is the ambiguious input format]
SELECT '1/5/2025'::date; -- 2025-01-05
SET DateStyle = 'ISO, DMY';
SELECT '1/5/2025'::date; -- 2025-05-01

CREATE TABLE timestamp_example (
	id serial PRIMARY KEY,
	timestamp_without TIMESTAMP WITHOUT TIME ZONE,
	timestamp_with TIMESTAMP WITH TIME ZONE
);

```

### Check Constraints

Check constraints are used to enforce data integrity by ensuring that the values in a column meet certain conditions.
Beware that these constraints should not include too much business logic.

They can be defined at the column level or table level:

```sql
-- Column constraint
CREATE TABLE check_example (
    price NUMERIC CHECK (price > 0),
    discount NUMERIC CONSTRAINT discount_must_be_positive CHECK (discount > 0), -- the error message is cleaner
    abbr TEXT CHECK (LENGTH(abbr) = 5)
);
INSERT INTO check_example (price, price_2, abbr) VALUES (10.0, -10.0, 'abcde'); -- OK

-- Table constraint
CREATE TABLE check_example (
    price NUMERIC CHECK (price > 0),
    discount NUMERIC CONSTRAINT discount_must_be_positive CHECK (discount > 0), -- the error message is cleaner
    abbr TEXT CHECK (LENGTH(abbr) = 5),
    CHECK (price > discount)
);
```

### Domain types

A domain is a named data type with optional constraints.
It can be used to enforce data integrity and consistency across multiple tables.
It can reference only a single column.
It is evaluated at the time of insertion or update, if you alter it, it will not affect the existing data.

```sql
CREATE DOMAIN us_postal_code as TEXT CONSTRAINT format CHECK (
	VALUE ~ '^\d{5}$' OR VALUE ~ '^\d{5}-\d{4}$'
);

CREATE TABLE address (
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code us_postal_code NOT NULL
);

INSERT INTO address (street, city, postal_code) VALUES ('123 Main St', 'Anytown', '1234'); -- Error
```

### Charset (or Encoding) and Collation

The character set (or encoding) is the way that characters are represented in bytes and defines
the range of valid characters that can be stored in a database.

The collation is the set of rules that determine how strings are compared and sorted (eg. case sensitivity, accent sensitivity, etc).

Note that these settings are set at the database level and can be overridden at the column level.
Moreover, a client connection has an encoding too (`SHOW client_encoding;`) and the server will try
to convert the data to the client's encoding.

```sql
-- Show the current database encoding
SHOW server_encoding;
-- List all the available encodings:
SELECT * FROM pg_collation;

SELECT 'abc' = 'ABC' COLLATE "en_US.utf8" as result; -- false: case sensitive

CREATE COLLATION en_us_case_insensitive (
	provider = icu,
	locale = 'en-US-u-ks-level1',
	DETERMINISTIC = false
);
SELECT 'abc' = 'ABC' COLLATE "en_us_case_insensitive" as result; -- true: case insensitive
```

### Timezone

[PG Documentation](https://www.postgresql.org/docs/17/datetime-posix-timezone-specs.html).
Full timezone names are better than offsets because they are more human-readable and
they take into account daylight saving time changes that can occur in some regions.

```sql
SHOW time zone; -- UTC

-- List all the available time zones:
SELECT * FROM pg_timezone_names;

-- Set the timezone for the current session:
SET time zone 'America/Chicago';

-- Set the timezone for the database:
ALTER DATABASE your_database_name SET TIME ZONE 'America/Chicago';

SET time zone 'UTC';
SELECT
	'2024-01-31 11:30:08'::TIMESTAMPTZ, -- 2024-01-31 11:30:08+00
	'2024-01-31 11:30:08+00:00'::TIMESTAMPTZ -- 2024-01-31 11:30:08+00
;

SET time zone 'America/Chicago';
SELECT
	'2024-01-31 11:30:08'::TIMESTAMPTZ, -- ❗️ 2024-01-31 11:30:08-06
	'2024-01-31 11:30:08+00:00'::TIMESTAMPTZ -- 2024-01-31 05:30:08-06
;
-- ❓ Here PG converted the UTC timestamp to the local timezone

SET time zone 'UTC';
SELECT
  '2024-01-31 11:30:08'::TIMESTAMPTZ, -- 2024-01-31 11:30:08+00
	'2024-01-31 11:30:08'::TIMESTAMPTZ AT TIME ZONE 'America/Chicago', -- 2024-01-31 05:30:08 ❓ Converted to a Timestamp without TZ!
  '2024-01-31 11:30:08'::TIMESTAMPTZ AT TIME ZONE 'CST', -- 2024-01-31 05:30:08 Time zone abbreviation
  '2024-01-31 11:30:08'::TIMESTAMPTZ AT TIME ZONE 'CDT', -- 2024-01-31 06:30:08 (Close, but WRONG)
	'2024-01-31 11:30:08'::TIMESTAMPTZ AT TIME ZONE '-06:00', -- 2024-01-31 17:30:08 Wrong
  '2024-01-31 11:30:08'::TIMESTAMPTZ AT TIME ZONE '+06:00', -- 2024-01-31 05:30:08 Correct
  '2024-01-31 11:30:08'::TIMESTAMPTZ AT TIME ZONE INTERVAL '-06:00' -- 2024-01-31 05:30:08 Correct
;
```

### JSON

Rules of thumb:

- If you need to query some keys, it should be a (generated) column
- If the json has a schema, split into multiple columns
- It is limited to ~30MB

```sql
SELECT
	'1'::json,
	'1'::jsonb,
	pg_column_size('1'::json), -- 5
	pg_column_size('1'::jsonb), -- 20
	'{"a":     "hello"}'::json, -- ❗️ The space is preserved
	'{"a":     "hello"}'::jsonb -- ❗️ The space is removed
;
```

While JSONB is bigger than JSON, it is more efficient to query and index.
The JSON data type is stored as a text string, while JSONB is stored in a binary format.
For this reason, JSONB does not preserve the order of keys and it trims unnecessary whitespace.

### Arrays

When should you use arrays VS a separate table?

1. Simplicity in Data Modeling: Arrays allow you to store related values directly in one column, avoiding the need for additional tables and joins
2. Efficient Retrieval for Certain Use Cases: Arrays provide a compact and efficient way to access that data as a whole
3. Reduced Query Complexity: Arrays can eliminate the need for intermediate linking tables, which can simplify your schema and queries
4. Rich Querying Capabilities: PostgreSQL provides a robust set of functions and operators for working with arrays
5. Storage Optimization for Fixed Relationships: if values are always tightly coupled, arrays keep everything together, possibly improving performance and reducing join overhead.
6. Alternative to JSON Arrays: while JSON also supports arrays, PostgreSQL native arrays come with specific syntax and indexing advantages, and are a distinct data type with dedicated support

```sql
CREATE TABLE array_example (
  id serial PRIMARY KEY,
  int_array INT[],
  text_array TEXT[],
  bool_array BOOLEAN[],
  nested_array INT[][]
);

INSERT INTO array_example (int_array, text_array, bool_array)
VALUES
(
  ARRAY[1, 2, 3, 4],
  ARRAY['marigold', 'daisy', 'poppy', 'sunflower'],
  ARRAY[true, false, true, false]
);

-- Curly braces syntax
INSERT INTO array_example (nested_array)
VALUES ('{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}');

SELECT
	id,
	text_array[1], -- ❓ 1-based index
	text_array[1:3], --  Slice
  text_array[:3], --  Up to 3
  text_array[3:], --  From 3
  text_array[1:10] -- ❗️ Out of range is OK
FROM array_example;

WITH flowers AS (
  SELECT
    id,
    unnest(text_array) AS flower -- Convert array to rows
  FROM array_example
)
SELECT * FROM flowers WHERE flower = 'poppy';
```

## Indexes

Indexes are used to speed up the retrieval of data from a table:
- Indexes are a separate discrete data structure from a table. The most common type of index is the B-tree index, which is used for equality and range queries.
- It maintains a copy of part of the data, so we can't create an index for everything or it will slow down the database instead of speeding it up.
- Each index's item has a pointer to the data in the table (CTID), to retrieve the rest of the row.

Under the hood, PostgreSQL has multiple **pages**. It is a equal sized blocks and in those pages,
there are the rows.. like an heap space.

Index names are not global to a database, but they are global to a schema.

```sql
SELECT
	id,
	ctid -- Secret column that contains the physical location of the row
FROM array_example; -- Returns: 1, (0,1)

-- The CTID can be queryed directly, but don't do it because the VACUUM operation changes it 😄
SELECT id, ctid
FROM array_example
WHERE ctid = '(0,2)';
```

The `CTID` says that the row is in the page `0` and the row `1`.

---

In PostgreSQL every index is a secondary index, meaning that it is not the primary key of the table.
You can have multiple secondary indexes on a table, but only one primary index (or primary key).


### B-tree Index

Balanced tree index is a data structure that maintains sorted data and allows for efficient insertion, deletion, and search operations.  
It is the most common type of index and it is used for:
- Equality and range queries
- Sorting
- Grouping

```sql
CREATE TABLE btree_example (
  id serial PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

INSERT INTO btree_example (name, email) VALUES
  ('John Doe', 'john@demo.com'),
  ('Jane Doe', 'jane@demo.com'),
  ('Alice Smith', 'alice@demo.com');

CREATE INDEX idx_name ON btree_example (name);
```

When creating an index, we need to consider the following:

- **Cardinality**: The number of distinct values in the column. Higher cardinality means better performance.
- **Selectivity**: The fraction of rows that match a query. Higher selectivity means better performance.

Example: a boolean column has low cardinality and selectivity, so it is not a good candidate for an index.

```sql
-- Count the selectivity of a column:
SELECT
    COUNT(DISTINCT birthday) as cardinality,
    (COUNT(DISTINCT birthday)::decimal / COUNT(*)::decimal)::decimal(7,4) as selectivity
FROM
    users;

-- If we try a query with a low selectivity (a boolean column):
SELECT
    COUNT(DISTINCT is_pro) as cardinality,
    (COUNT(DISTINCT is_pro)::decimal / COUNT(*)::decimal)::decimal(17,14) as selectivity -- 0.000002!
FROM
    users;

-- BUT In some cases, it is still worth to create an index on a boolean column:
SELECT count(*) filter (where is_pro is true) FROM users; -- 44k across 1M rows
SELECT
    ((count(*) filter (where is_pro is true)) / COUNT(*)::decimal)::decimal(17,14) as selectivity -- 0.04483
FROM
    users;
-- In this case, we want to index a limited number of rows, so the selectivity is higher, but if
-- our users are 50% pro and 50% not, the selectivity will be lower and the index will be less useful
```

If the selectivity is closer to 1, the better selectivity it is.
Note that PostgreSQL uses a cost-based optimizer, so it will choose the best index based on the selectivity and cardinality.
Sometimes, it will choose a sequential scan instead of an index scan if it thinks it is faster.


### Primary Key: UUID vs Integer

..or should we use BigInt instead?

Why not UUID?

- There are 7 versions of UUID and the v4 (random) is the most common. (Use v7 for sequential UUIDs)
- UUIDs are not sequential, and they can break the B-tree index requiring a rebalancing of the index
- The size is bigger (16 bytes) than an integer (4 bytes) or bigint (8 bytes)
- UUIDs are not human-readable
- Unless needed, the suggestion is to use a serial bigint primary key

### Composite Indexes

A composite index is an index on multiple columns.
To get the most out of a composite index, we need to keep in mind basic 2 rules:

1. **Left to right, no skipping**: The order of the columns in the index matters. The most selective column should be first.
2. **Stops at first range**: PostgreSQL use strict equality for as long as possible, but as soon as it hits a range condition (<, >, <=, >=), it stops traversing and switches to a sequential scan from that point on.

```sql
CREATE INDEX multi ON users USING BTREE (fist_name, last_name, birthday);

SELECT * FROM users WHERE last_name = 'Doe'; -- KO: the index is not used
SELECT * FROM users WHERE last_name = 'Doe' AND first_name = 'John'; -- OK: the index is used
SELECT * FROM users WHERE first_name = 'John' AND birthday = '1990-01-01'; -- OK: the index is used even if we skip the last name

-- OK: the index is used but the range condition triggers an Index Scan
SELECT * FROM users WHERE first_name = 'Aaron' AND last_name = 'Francis' AND birthday < '1989-12-31';
```

Anyway PostgreSQL has the ability to scan two or more indexes at the same time and combine the results.
Sometimes, this could be even faster than a composite index; an example is when the `WHERE` clause has some `OR` conditions.
So, **it depends** on the query and the data distribution of our business data.

### Covering Indexes

A covering index is an index that contains all the columns needed to satisfy a query,
so the database engine can retrieve the data directly from the index without having to access the table
by using an `Index Only Scan`.

```sql
CREATE INDEX idx_name_email ON btree_example (name, email);

SELECT name, email FROM btree_example WHERE name = 'John Doe'; -- OK: ONLY the index is used
SELECT id, name, email FROM btree_example WHERE name = 'John Doe' -- ❗️ This will use the index and the table

-- But 🚀:
CREATE INDEX idx_name_email_with_id ON btree_example (name, email) INCLUDE (id);
-- Now the previous query will use the index only and it will be faster
```

### Partial Indexes

When the data is skewed and the Selectivity is low, we can use partial indexes to improve performance.
Partial indexes are indexes that only include a subset of the rows in a table based on a condition.

```sql
CREATE INDEX email ON users (email) WHERE is_pro IS true;

SELECT * FROM users WHERE email = '...' AND is_pro IS true; -- OK: the index is used
SELECT * FROM users WHERE email = '...'; -- ❗️ The index is not used
```

### Index ordering

Indexes are ordered by default, but we can specify the order of the index using the `ASC` or `DESC` keywords.
If the query is using `ORDER BY` with the opposite order, the index will be used backwards and it is fine.

The issue is when we use `ORDER BY` with multiple columns and the order is different from the index.
This happens because the index is a single structure and it can't be twisted.

```sql
CREATE INDEX ordering ON users (birthday, created_at);

SELECT * FROM users ORDER BY birthday DESC, created_at DESC; -- OK: the index is used
SELECT * FROM users ORDER BY birthday ASC, created_at DESC; -- ❗️ The index is used, but there is a Incremental Sort step

-- It is legit to create an index with different order:
CREATE INDEX ordering ON users (birthday ASC, created_at DESC);
```

### Ordering NULLs

By default, PostgreSQL sorts `NULL` values first in ascending order and last in descending order, but it can be changed:

```sql
SELECT * FROM users ORDER BY birthday ASC NULLS LAST;
CREATE INDEX ordering ON users (birthday ASC NULLS FIRST);
```

### Functional Indexes

Functional indexes are indexes that are based on the result of a function applied to one or more columns.
We can use them to extract a part of a column or to transform the data in some way, even JSON data.

```sql
CREATE INDEX email_domain ON users( (split_part(email, '@', 2)) );

EXPLAIN SELECT * FROM users WHERE split_part(email, '@', 2) = 'example.com'; -- OK: the index is used
EXPLAIN SELECT * FROM users WHERE email LIKE '%@example.com'; -- ❗️ The index is not used
```

### Hash Indexes

The hash index is used for equality queries only and it is not as efficient as B-tree indexes.
It is faster than B-tree indexes for equality queries, but it is not as flexible.

The advantage is that it is faster to create and it uses less space because its key size are constant.


## Query Plans

Query plans are the way PostgreSQL decides how to execute a query.
They are generated by the query planner and they can be viewed using the `EXPLAIN` command.

The explain retruns a tree structure that shows the steps that PostgreSQL will take to execute the query.
It must be read inside out, so the first step is the last one to be executed.

```sql
EXPLAIN (format json) SELECT * FROM users WHERE first_name = 'John';
```

There are different types of nodes:

- **Seq Scan**: Read the entire table in physical order. A sequential scan is a full table scan. It is used when there is no index on the table or when the query is not selective enough to use an index.
- **Bitmap Index Scan**: Postgres does not need to read the entire table to find the rows that match the query. Instead, it uses a bitmap index scan to find the rows that match the query and then reads those rows from the table.
- **Bitmap Heap Scan**: It works with a bitmap index scan to retrieve the rows that match a Bitmap Index Scan. It put the results in physical order and then read the rows from the table.
- **Recheck**: A recheck is used to verify that the rows returned by a bitmap index scan match the query. It actually executes the condition again to make sure that the rows returned are correct because the index scan could say "ehi, there are some rows that match the query, in this page", but it is not sure that all the rows in that page match the query.
- **Index Scan**: Scan the index and get the rows. An index scan is used when there is an index on the table and the query is selective enough to use it.
- **Index Only Scan**: Same as an index scan, but it does not read the heap. It is used when the index contains all the columns needed to satisfy the query.

### Costs and Rows

Let's take a look at the output of the `EXPLAIN` command:

```
Seq Scan on users  (cost=0.00..16.25 rows=1 width=133)

-- EXPLAIN ANALYZE produces this output:
Seq Scan on users  (cost=0.00..16.25 rows=1 width=133) (actual time=0.005..0.006 rows=0 loops=1)
```

- **cost**: The cost of the operation in "cost units". The first number is the startup cost, which is the cost to start the operation, and the second number is the total cost, which is the cost to complete the operation.
- **rows**: The estimated number of rows that will be returned by the operation.
- **width**: The bytes estimated to be returned by the operation.
- **actual time**: The actual time taken to execute the operation. The first number is the startup time, and the second number is the total time.
- **actual rows**: The actual number of rows returned by the operation. It can be different from the estimated number of rows.
- **loops**: The number of times the operation was executed

The cost unit is an arbitrary unit that is used by PostgreSQL to estimate the cost of an operation like
the cost to read a sequential page, the cost to read a random page, some CPU costs. It's made up of several different things and those are all tuneable.

To optimize the query, you can compare the cost on the same system and the same data.

## CTE: Common Table Expressions

TODO

## View

Views are virtual tables that are defined by a query.
They can be used to simplify complex queries and to provide a layer of abstraction over the underlying tables.

You have a table like `bookmarks` that's being queried frequently for **historical statistics**.
Recomputing aggregates over large volumes of old data every time is inefficient and
we must improve the read performance by storing historical aggregates in a **materialized view**, and compute only the **recent data live**.

A materialized view is a snapshot of the data at a point in time, and it can be refreshed to update the data.
It is a physical table that stores the result of a query, and it can be indexed like a regular table.

```sql
CREATE MATERIALIZED VIEW bookmarks_rollup_historic AS (
  SELECT saved_on, COUNT(*)
  FROM bookmarks
  WHERE saved_on < (CURRENT_DATE - INTERVAL '1' DAY)
  GROUP BY saved_on
);

-- The query plan shows a sequential scan of the materialized view
EXPLAIN SELECT * FROM bookmarks_rollup_historic;
```

If we want to get all the data, we must:

```sql
SELECT * FROM bookmarks_rollup_historic
UNION ALL
SELECT saved_on, COUNT(*)
  FROM bookmarks
  WHERE saved_on >= (CURRENT_DATE - INTERVAL '1' DAY)
  GROUP BY saved_on;
```

But, for simplicity we can create a view on top of the materialized view and the live query:

```sql
CREATE VIEW bookmarks_rollup AS (
  SELECT * FROM bookmarks_rollup_historic
  UNION ALL
  SELECT saved_on, COUNT(*)
    FROM bookmarks
    WHERE saved_on >= (CURRENT_DATE - INTERVAL '1' DAY)
    GROUP BY saved_on
);

-- The query plan shows a sequential scan of the materialized view
EXPLAIN SELECT * FROM bookmarks_rollup;
```

| Feature               | Regular View                 | Materialized View              |
| --------------------- | ---------------------------- | ------------------------------ |
| Data Freshness        | Always current               | May be stale                   |
| Query Performance     | Slower for expensive queries | Fast (reads from disk)         |
| Storage               | No                           | Yes                            |
| Manual Refresh Needed | No                           | Yes                            |
| Can be Indexed        | No                           | ✅ Yes                         |
| Ideal For             | Live, lightweight queries    | Heavy, infrequent computations |


### Refreshing the Materialized View

A materialized view must be refreshed to update the data.
It can be performed by running the query:

```sql
REFRESH MATERIALIZED VIEW bookmarks_rollup_historic;

-- Optionally, use the CONCURRENTLY option to avoid read locks (requires a unique index):
REFRESH MATERIALIZED VIEW CONCURRENTLY bookmarks_rollup_historic;
```

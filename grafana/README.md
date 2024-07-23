# Grafana Partner Training

Grafana is a multi-platform open source analytics and interactive visualisation web application.

## Solution Architect Track

Overview:

- Week 1: Build a Stack (2 hours) and Grafana Visualization (2.5 hours)
- Week 2: Metrics (4 hours)
- Week 3: Logs (3 hours)
- Week 4: Traces (2 hours)

### Week 1

#### Launching a cloud stack

After finishing this course, you'll be able to:

- Create up a Grafana Cloud stack
- Send some metrics to Grafana Cloud
- Add a dashboard

Important concepts:

- Organization: is the billing entity in Grafana Cloud. It can have multiple users and stacks. The name is [a-zA-Z0-9 <symbols>]
- Slug:unique identifier for the org. Only lowercase letters and numbers are allowed.
- Stack: set of running services: Grafana for visualization, databases for metrics, logs, and traces, and additional services like K6 for load testing. It deploys to AWS by default.
- Users: an email address associated with organizations and stacks, it is not restricted to a single organization or stack.

My free Grafana Cloud org:

- https://mspigolon.grafana.net: Grafana Cloud
- https://grafana.com/orgs/mspigolon: Manage the Grafana Cloud organization and stacks

Now connect [these datasources](ops_SECRET) to your stack.

Done

Feedback:
In the next session it is explained how to run a local stack.

#### Launching a local stack

After finishing this course, you'll be able to:

- Create up a Grafana local stack
- Send some metrics to Grafana Cloud
- Add and customize a dashboard

A local stack includes all the components to run Grafana locally. It is useful for development and testing.
Download this [repository](https://github.com/grafana/intro-to-mltp).

It includes:

- Docker Compose manifest for easy setup.
- Four-service application:
  - A service requesting data from a REST API server.
  - A REST API server that receives requests and utilises a Database for storing/retrieving data for those requests.
  - A recorder service for storing messages to an AMQP bus.
  - A Postgres Database for storing/retrieving data from.
- k6 service running a load test against the above application.
- Tempo service for storing and querying trace information.
- Loki service for storing and querying log information.
- Mimir service for storing and querying metric information.
- Pyroscope service for storing and querying profiling information.
- Beyla services for watching the four-service application and automatically generating signals.
- Grafana service for visualising observability data.
- Grafana Agent service for receiving traces and producing metrics and logs based on these traces.
- A Node Exporter service to retrieve resource metrics from the local host.

Good to know about the repository:

- Grafana mounts two repository directories to provide pre-provisioned data sources for data
  - `grafana/definitions` and `grafana/provisioning`
- Grafana exposes port 3000 for local login
- Grafana enables two Tempo features, namely span search and service graph support
- **Mimir** is a backend store for metrics data from various sources
- **Loki** is a backend store for long-term log retention
- **Tempo** is a backend store for longterm trace retention
- **Pyroscope** is a backend store for profiling data
- **Beyla** is a service that watches the four-service application and automatically generates signals

Now run `docker compose up` to start the stack.

Login to Grafana at http://localhost:3000 (no credentials required).
The existing MLT Dashboard shows a **RED (Rate, Error, Duration)** overview.

Move around the dashboard and explore the data.

Done

#### Grafana Visualizations Fundamentals

After finishing this course, you'll be able to:

- Understand the importance of positioning visualizations in Grafana to effectively communicate complex data.
- Utilize essential techniques for presenting data in an intuitive and impactful manner
- Discover how to leverage Grafana's visualization capabilities to drive data-driven decision-making, optimize business operations, and effectively communicate valuable insights to customers.

Key concepts:

- Identify the customer's pain points to develop custom solutions
  - Unable to consolidate observability vendors due tech debt, politics, or budget constraints
  - Users of enterprise data source (competitors)
  - Challenges with operationalizing Grafana within their organization
  - Familiar with commercial OSS evaluation & purchasing process
- Tipical pain points:
  - **Data silos**: data is spread across multiple tools and teams (so hindered collaboration and decision-making)
  - **Data quality**: data is not accurate or reliable
  - **Data access**: data is not accessible to all teams in one single place
- Grafana can **Visualize** and **Correlate** data from virtually any data source, freeing our customers to utilize whatever tooling they want, avoiding migrations

Conversation map:

1. Discovery: which tools are you using?
2. Discovery Lv2: How many teams are using different tools?
3. Negative consequences: How do you troubleshoot issues?
4. Proof Point: ..this is how ACME Corp solved this problem
5. Value Statements:

- Boost productivity
- Gain actionable insights
- Improve collaboration

Done

#### Hands-on with Grafana Visualization

After finishing this course, you'll be able to:

- Design dashboard layouts
- Create visually appealing dashboards
- Organize data in logical ways
- Adjust for accessibility and color conventions
- Choose appropriate metrics

Key concepts:

- Every dashboard should have a clear purpose
- Target Audience: Who are you building the dashboard for?
- Target Media: Where will the dashboard be displayed?
- Visual Hierarchy: What is the most important information?
  - Alignment in Z-pattern, but it changes based on the audience
  - Size: bigger is more important
  - Color: use color to highlight important information
  - Shapes: complex shapes are exating (multiple visualization types)
  - Don't stack panels
  - Add colors to keep bigger panels from taking over

Design examples with Loki:

- Logical grouping: group by service, by environment, by team
- Sizing: bigger is more important
- Upper is general, lower is specific
- Accessible dashboards: no red-green colorblindness, no color-only information, no color as the only way to differentiate. Thick lines and Solid fills are better than thin lines and gradients.

Exercise: download this [repository](https://github.com/grafana/quick-dashboard-makeover).

What are the key use cases does Grafana deliver?

1. Service Dashboard: The RED monitoring dashboard
2. Infrastructure Dashboard: The **USE (Utilization, Saturation, Errors)** monitoring dashboard
3. The Four Golden Signals:

- Latency: how long it takes to serve a request
- Traffic: how many demands are being made on the service
- Errors: how many requests are failing
- Saturation: how much "full" the service is

Practical tricks:

- Show state with colors
- Use text to signify the state
- Columns and spacing
- Drilldowns Links to other dashboards/resources (generated with a Link Parameter)
- Annotations: add context to the data
- Library Panels to reuse panels across dashboards
- https://play.grafana.org: a playground to test Grafana features

Exercise: [KitchenOps Challenge](https://github.com/grafana/quick-dashboard-makeover/blob/main/Exercices/2%20KitchenOps.md)

_Not completed_

### Week 2

#### Grafana Metrics Fundamentals - Common Challenge 1

Metrics Common Challenge 1 talks about a range of challenges scaling with metrics: outages, gaps in graphs, slow queries, unpredictable costs, and more.

After finishing this course, you'll be able to:

- Articulate the rationale and pain behind why scaling OSS metrics can often be challenging
- Choose initial personas from your accounts to target with this sales play
- Confidently speak to metrics as a product during initial calls with prospects

Key concepts:

- **Metrics**: are money-maker but it is a complex product because it is based on customer use case
- Grafana Metrics: is a scalable, multi-tenant, and highly available Prometheus-as-a-Service offering. It is based on Cortex.
- Grafana released Mimir, it was Cortex 2.0 with a new license to block vendors from selling it as a service.
- Ideal customer should use Grafana for Visualization but facing scaling issues.
- Thanos is not multi-tenant, it is a single-tenant solution.
- AWS AMP is based on Cortex.
- Adaptive Metrics: Grafana detect and reduce unused metrics, reducing costs.

Common challenges:

- Reliability on Prometheus
- Instability: outages, data loss, and performance issues
- Toil: manual work to keep Prometheus running or to run queries
- Access control

#### Grafana Metrics Fundamentals - Common Challenge 2

Metrics Common Challenge 2 focuses on a single metrics scaling challenge: the 2-week data retention of Prometheus.

After finishing this course, you'll be able to:

- Explain how Grafana Metrics offers a better long-term storage than Prometheus
- Choose initial personas from your accounts to target with this sales play
- Confidently speak to metrics as a product during your initial conversations

Key concepts:

- The client wants to keep data for more than 2 weeks

#### Grafana Metrics Fundamentals - Common Challenge 3

Difficulty in managing high costs of storing metrics.

After finishing this course, you'll be able to:

- Articulate why Grafana metrics is able to be more cost effective for customers.
- Choose initial personas from your accounts to target with this sales play.

Key concepts:

- Grafana Cloud is build on a modern architecture
- Grafana Cloud ships cost-saving features
- Grafana Cloud does not charge for Prometheus storage

#### Hands-on with Metrics

After finishing this course, you'll be able to:

- Understand why customers use metrics
- How Prometheus handles metrics
- Explore, query and visualize metrics
- Export data from a node into Prometheus

Key concepts:

- Metrics powered by Mimir
- Logs powered by Loki
- Traces powered by Tempo
- What: A metric is a number that tells you how much of something exists over a period of time
- Why: It understands trends, patterns, and anomalies. It saves time and money
- Metrics are stored in a **time series database (TSDB)**
- Prometheus is a popular open-source TSDB
- Prometheus's data model is a multi-dimensional data model consisting of key-value pairs called labels
- Prometheus has a **pull model**: it scrapes metrics from the targets
- Prometheus has a **query language**: PromQL
- Data collection via native support, embedded exporters, and external exporters

### Week 3

#### Grafana Logs Fundamentals

After finishing this course, you'll be able to:

- Articulate the rationale and pain behind our sales play: "Rising logging costs are becoming prohibitive."
- Choose initial personas from your accounts to target with this sales play.
- Confidently speak to logging as a product during initial calls.

Key concepts:

- Grafana Logs is more cost-effective than other solutions
- Grafana Logs does not run analytics or security research on logs
- Grafana Logs does not require much work to set up
- Logs Conversation Map

#### Hands-on with Loki

After finishing this course, you'll be able to:

- What are logs and why correlating metrics and logs is critical across the development lifecycle
- The challenges of large-scale log management
- How Grafana Loki helps you reduce your logging costs and operations overhead
- Grafana in action with a demo on the power of the LogQL query language, and how to use it for use cases such as debugging, monitoring, analytics, and alert management

Key concepts:

- Logs are a record of events that happen in a system
- Loki has been built for developers and operators
- Loki uses an inexpensive storage backend, it does not require indexing
- Loki is not ready for cybersecurity, business intelligence or compliance use cases
- You can use an agent to send logs to Loki (Promtail, Grafana Agent, Fluentd, Logstash, etc..)
- Promtail run on each node in a Kubernetes cluster and sends logs to Loki

#### Getting started with LogQL

After finishing this course, you'll be able to:

- Demo on the power of the LogQL query language
- Show how to use it for use cases such as debugging, monitoring, analytics, and alert management

Key concepts:

- Loki does not index logs
- Loki groups logs into streams and indexes the streams with labels
- The log line content is not indexed. The timestamp and labels are indexed.
- 10 TB of logs can produce 200 MB of index data
- The index-free solution is cheaper and faster
- The biggest Loki installation ingest 650 TB of logs per hour
- LogQL is a query language for logs
- With aggregation functions, you can pull metrics for log metrics and patterns of metrics

### Week 4

#### Tracing Fundamentals

This course includes three main objectives:

- Visualizing traces & the Anatomy of a Trace in Grafana
- The Grafana Cloud stack and understanding how traces reach it
- Correlating between MLT signals

Key concepts:

- 4 Pillars of Observability: Metrics, Logs, Traces, and Profiling
- Metrics: is something happening?
- Logs: what happened?
- Traces: where is it happening?
- Profiling: how do I fix it? (Pyroscope)
- A trace is a group of spans (units of work), at least one span (root span)
- Each span has its own UUID + the Span Context (trace UUID)
- [Span Links](https://opentelemetry.io/docs/specs/otel/overview/#links-between-spans): a way to correlate between spans
- Span Events: report important events in the span
- Grafana Tempo: a distributed tracing backend that requires an object storage to operate
- Tempo is multi-tenant and scales horizontally

#### Hands-on with Tracing

This course includes this hands-on objective:

- Correlating between MLT signals

Key concepts:

- A **Derived Field** is a field that is calculated from log data
- **Exemplars**: is a specific trace representative of measurement taken in a given time interval
- **Correlation** is a new feature that may replace derived fields because it is more powerful

Done

# css-grid-flexbox-v2

Course material for the course on Frontend Masters:

- [Source Code](https://github.com/FrontendMasters/grid-flexbox-v2/)
- [Web App](https://frontendmasters.github.io/grid-flexbox-v2/)
- [Course](https://frontendmasters.com/courses/css-grid-flexbox-v2/)


# Notes

## Guiding principles

- Grid based layout
- Images that resize
- Media queries

## Flaxbox

- Flex containers are the parent elements
- Flex items are the children elements
- Main axis is the direction of the flex items (horizontal or vertical)
- If you use width and height, it will override the flexbox and you will lose the responsiveness
- Disadvantage: Works in 1 dimension

### Flexbox grid

- You define `row` and `column` as classes

```html
<div class="row">
  <div class="col-1">Col 1</div>
  <div class="col-1">Col 2</div>
  <div class="col-1">Col 3</div>
  <div class="col-1">Col 4</div>
</div>

<style>
  .row {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    gap: 1%;
  }

  .col-1 {
    /* desktop */
    flex-basis: 24%;

    /* tablet */
    flex-basis: 48%;

    /* phone */
    flex-basis: 98%;
  }
</style>
```

### Resources

- Refresher on flexbox: [https://css-tricks.com/snippets/css/a-guide-to-flexbox/](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- Play with flexbox:
  - [https://flexboxfroggy.com/](https://flexboxfroggy.com/)
  - [http://www.flexboxdefense.com/](http://www.flexboxdefense.com/)
- Suggested book: [Image Optimization](https://www.smashingmagazine.com/2021/04/image-optimization-pre-release/)
- Generates `srcset` images: [https://www.responsivebreakpoints.com/](https://www.responsivebreakpoints.com/)

## Responsive images

Key rule: **only one image should be downloaded**

- Content choices
- Formats
- Pixel density
- Image display size

Who chooses the image to display, you or the browser?

- `<picture>` element: You choose
- `srcset` attribute: Browser chooses

## Grid

- Doesn't require `row` class
- Works on 2 dimensions

```html
<div class="wrapper">
  <div class="col-1">Col 1</div>
  <div class="col-2">Col 2</div>
  <div class="col-3">Col 3</div>
</div>

<style>
  .wrapper {
    display: grid;
    gap: 10px;
  }

  .col-1 {
    /* attribute: from / to */
    grid-column: 1 / 2;
    grid-row: 1 / 3;
  }
  .col-2 {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
  .col-3 {
    grid-column: 3 / 4;
    grid-row: 2 / 3;
  }
</style>
```

### Resources

- Refresher on grid: [https://css-tricks.com/snippets/css/complete-guide-grid/](https://css-tricks.com/snippets/css/complete-guide-grid/)
- Play with grid: [https://cssgridgarden.com/](https://cssgridgarden.com/)

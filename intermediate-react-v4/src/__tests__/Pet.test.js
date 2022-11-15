/**
 * @jest-environment jsdom
 */

import { expect, test } from '@jest/globals';
import { render } from '@testing-library/react';
import { StaticRouter } from "react-router-dom/server";
import Pet from '../Pet';

test('Display a default thumbnails', async () => {
  const pet = render(
    <StaticRouter>
      <Pet />
    </StaticRouter>
  );
  const petThumbnail = await pet.findByTestId('thumbnail');
  expect(petThumbnail.src).toContain('none.jpg');
});

test('Display a non-default thumbnails', async () => {
  const pet = render(
    <StaticRouter>
      <Pet images={['1.jpg', '2.jpg']} />
    </StaticRouter>
  );
  const petThumbnail = await pet.findByTestId('thumbnail');
  expect(petThumbnail.src).toContain('1.jpg');
});

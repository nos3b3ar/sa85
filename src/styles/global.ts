import { createGlobalStyle } from 'styled-components';
import { styleReset } from 'react95';

export const GlobalStyles = createGlobalStyle`
  ${styleReset}

  @font-face {
    font-family: "MS Sans Serif";
    src: url("/fonts/ms_sans_serif.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "MS Sans Serif";
    src: url("/fonts/ms_sans_serif_bold.woff2") format("woff2");
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "IBM VGA 8x16";
    src: url("/fonts/WebPlus_IBM_VGA_8x16.woff") format("woff");
    font-weight: 400;
    font-style: normal;
    font-display: block;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root, .shell {
    height: 100%;
  }

  body {
    margin: 0;
    overflow: hidden;
    background: #000;
    color: #000;
    font-family: "MS Sans Serif", Tahoma, sans-serif;
  }

  button, input, textarea {
    font-family: inherit;
  }
`;

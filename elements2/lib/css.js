// css the elements share, interpolated into their styles

// a button without the browser's look
export const PLAIN_BUTTON = `
  align-items : center;
  background  : none;
  border      : 0;
  color       : inherit;
  cursor      : pointer;
  display     : inline-flex;
  font        : inherit;
  margin      : 0;
  padding     : 0;
`;

// one line of text, cut off with … where it does not fit
export const ELLIPSIS = `
  min-inline-size : 0;
  overflow        : hidden;
  text-overflow   : ellipsis;
  white-space     : nowrap;
`;

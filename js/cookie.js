// cookie.js

export const cookie = ( name, value, days, domain ) => {
  if( name.startsWith('?') ){
    let key = name.slice(1);
    let result = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    // has cookie / does cookie exist
    if( value === undefined ) return !!result;
    // is cookie (value of)
    return result ? result[2] === value : false;
  }
  // get cookie
  if( !name.startsWith('!') && !value && !days ){
    let result = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return result ? result[2] : null;
  }
  // (set values to) delete cookie
  if( name.startsWith('!') ){
    name = name.slice(1)
    value = ''
    days = -1
  }
  // set cookie
  let date = new Date;
  date.setTime( date.getTime() + 24 * 60 * 60 * 1000 * ( days || 1000 ) );
  let theDomain = domain ? ';domain=' + domain : '';
  document.cookie = name + '=' + value + ';path=/;expires=' + date.toGMTString() + theDomain;
};

export default cookie;

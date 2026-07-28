// load ass.lsd spec in browser runtime
import { parseLSD } from '@cosmonaut/lsd';

const response = await fetch( new URL( './ass.lsd', import.meta.url ) );
if ( !response.ok ) throw new Error( `[ass] failed to load ass.lsd: ${response.status}` );

const source = await response.text();
export default parseLSD( source );

export default class ComputedStyle {
  custom     = {};
  inherited  = {};
  properties = {};
  
  get (name)       { return this.properties[name];  }
  set (name,value) { this.properties[name] = value; }
}



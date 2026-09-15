# @aufbau/icons

eigenes icons-package. wie schon bei `@aufbau/webfonts` wird das icons-package nehr oder weniger ein hybrid bzw es schlägt 2 fliegen mit einer klappe:
- einerseits opionated aufbau-standard icons-vorauswahl
- andererseits allgemein (so allgemein wie quasi möglich)

## todo

- [ ] `@aufbau/elements/AufbauIcon.js` (siehe ordner `/elements`) hier importien / exportieren
- [ ] die standard-icons-map aus `elements/AufbauIcon.js` kommt nach `iconw/data/` als json-file(s)
- [ ] icons-map dann wiederum in der webcomponent importieren (ist nur ne zwischenlösung), aber erstmal notwendig wegen breaking

- [ ] `<aufbau-icon>` fetcht ja das svg. jetzt bräuchte man eigtl noch ne mögochleit, dass wenn man das zeug nicht für browser-only nutzt sondern deno usw. also mit bundler usw. dass, dass die svg direkt gebubdelt werden und von da gelese. wie am besten? vite-plugin konstruieren? und/oder da irgendein iconify-package nutzen dass das zu 90% schon regelt?das wäre zu klären

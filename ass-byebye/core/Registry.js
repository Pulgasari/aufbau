import ASSObject from "./ASSObject.js";

export default class Registry extends ASSObject {

    #map = new Map();

    add(name, object) {

        this.#map.set(name, object);

        return object;

    }

    get(name) {
        return this.#map.get(name);
    }

    has(name) {
        return this.#map.has(name);
    }

    delete(name) {
        return this.#map.delete(name);
    }

    clear() {
        this.#map.clear();
    }

    values() {
        return this.#map.values();
    }

    entries() {
        return this.#map.entries();
    }

}

export default class Registry{

    #ids = new Map();

    #names = new Map();

    add(node){

        this.#ids.set(node.id,node);

        if(node.name){

            this.#names.set(node.name,node);

        }

        return node;

    }

    get(id){

        return this.#ids.get(id);

    }

    resolve(name){

        return this.#names.get(name);

    }

    }

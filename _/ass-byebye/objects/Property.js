import ASSObject from "../core/ASSObject.js";

export default class Property extends ASSObject {

    #config;

    constructor(ass, config) {

        super(ass);

        this.#config = config;

    }

    get name() {
        return this.#config.name;
    }

    get config() {
        return this.#config;
    }

}

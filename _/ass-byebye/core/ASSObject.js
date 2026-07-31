export default class ASSObject {

    #ass;

    constructor(ass) {
        this.#ass = ass;
    }

    get ass() {
        return this.#ass;
    }

}

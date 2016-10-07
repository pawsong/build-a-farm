class IdIssuer {
  private id: number;

  constructor() {
    this.id = 0;
  }

  issue() {
    return ++this.id;
  }
}

export default IdIssuer;

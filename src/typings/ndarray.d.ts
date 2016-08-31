declare module 'ndarray' {
  namespace n {
    export interface Ndarray {
      data: any;
      shape: any;
      stride: any;
      offset: any;
      set(...args): any;
      get(...args): any;
    }
  }

  function n(data: any, shape?: any, stride?: any, offset?: any): n.Ndarray;

  export = n;
}

declare module 'typedarray-pool' {
  type TypedArray = Uint8Array | Int32Array;

  type Dtype =
    'uint8' | 'uint16' | 'uint32' | 'int8' | 'int16' | 'int32' |
    'float' | 'float32' | 'double' | 'float64' |
    'arraybuffer' | 'data' | 'uint8_clamped' | 'buffer';

  namespace pool {
    function malloc(n: number, dtype?: Dtype): TypedArray;
    function mallocUint8(n: number): Uint8Array;
    function mallocInt32(n: number): Int32Array;
    function freeUint8(array: Uint8Array): void;
    function freeInt32(array: Int32Array): void;
  }

  export = pool;
}

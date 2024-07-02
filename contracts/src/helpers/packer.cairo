// Core imports

use core::Zeroable;
use core::NumericLiteral;

mod errors {
    const PACKER_ELEMENT_IS_MISSING: felt252 = 'Packer: element is missing';
}

trait PackerTrait<T, U, V> {
    fn get(packed: T, index: u8, size: V) -> U;
    fn contains(packed: T, value: U, size: V) -> bool;
    fn unpack(packed: T, size: V) -> Array<U>;
    fn remove(packed: T, item: U, size: V) -> T;
    fn replace(packed: T, index: u8, size: V, value: U) -> T;
    fn pack(unpacked: Array<U>, size: V) -> T;
}

impl Packer<
    T,
    +Into<u8, T>,
    +TryInto<T, u8>,
    +NumericLiteral<T>,
    +PartialEq<T>,
    +Zeroable<T>,
    +Rem<T>,
    +Add<T>,
    +Mul<T>,
    +Div<T>,
    +Drop<T>,
    +Copy<T>,
    U,
    +PartialEq<U>,
    +Into<u8, U>,
    +Into<U, u8>,
    +Drop<U>,
    +Copy<U>,
    V,
    +Into<V, T>,
    +Drop<V>,
    +Copy<V>,
> of PackerTrait<T, U, V> {
    fn get(packed: T, index: u8, size: V) -> U {
        let unpacked: Array<U> = Self::unpack(packed, size);
        *unpacked.at(index.into())
    }

    fn contains(mut packed: T, value: U, size: V) -> bool {
        let modulo: T = size.into();
        let mut index = 0;
        loop {
            if packed.is_zero() {
                break false;
            }
            let raw: u8 = (packed % modulo).try_into().unwrap();
            if value == raw.into() {
                break true;
            }
            packed = packed / modulo;
            index += 1;
        }
    }

    fn unpack(mut packed: T, size: V) -> Array<U> {
        let mut result: Array<U> = array![];
        let modulo: T = size.into();
        let mut index = 0;
        loop {
            if packed.is_zero() {
                break;
            }
            let value: u8 = (packed % modulo).try_into().unwrap();
            result.append(value.into());
            packed = packed / modulo;
            index += 1;
        };
        result
    }

    fn remove(mut packed: T, item: U, size: V) -> T {
        // [Compute] Loop over the packed value and remove the value at the given index
        let mut removed = false;
        let mut result: Array<U> = array![];
        let modulo: T = size.into();
        loop {
            if packed.is_zero() {
                break;
            }
            let value: u8 = (packed % modulo).try_into().unwrap();
            let current: U = value.into();
            if current != item {
                result.append(current);
            } else {
                removed = true;
            }
            packed = packed / modulo;
        };
        // [Check] Index not out of bounds
        assert(removed, errors::PACKER_ELEMENT_IS_MISSING);
        // [Return] The new packed value and the removed value
        Self::pack(result, size)
    }

    fn replace(mut packed: T, index: u8, size: V, value: U) -> T {
        // [Compute] Loop over the packed value and remove the value at the given index
        let mut removed = false;
        let mut result: Array<U> = array![];
        let mut idx: u8 = 0;
        let modulo: T = size.into();
        loop {
            if packed.is_zero() {
                break;
            }
            let raw_value: u8 = (packed % modulo).try_into().unwrap();
            let item: U = raw_value.into();
            if idx != index {
                result.append(item);
            } else {
                result.append(value);
                removed = true;
            }
            idx += 1;
            packed = packed / modulo;
        };
        // [Check] Index not out of bounds
        assert(removed, errors::PACKER_ELEMENT_IS_MISSING);
        // [Return] The new packed value and the removed value
        Self::pack(result, size)
    }

    fn pack(mut unpacked: Array<U>, size: V) -> T {
        let mut result: T = Zeroable::zero();
        let mut modulo: T = size.into();
        let mut offset: T = 1_u8.into();
        loop {
            match unpacked.pop_front() {
                Option::Some(value) => {
                    let value_u8: u8 = value.into();
                    result = result + offset.into() * value_u8.into();
                    if unpacked.is_empty() {
                        break;
                    }
                    offset = offset * modulo;
                },
                Option::None => { break; }
            }
        };
        result
    }
}

trait SizedPackerTrait<T, U, V> {
    fn get(packed: T, index: u8, size: V, len: u8) -> U;
    fn contains(packed: T, value: U, size: V, len: u8) -> bool;
    fn unpack(packed: T, size: V, len: u8) -> Array<U>;
    fn remove(packed: T, item: U, size: V, len: u8) -> T;
    fn replace(packed: T, index: u8, size: V, value: U, len: u8) -> T;
    fn pack(unpacked: Array<U>, size: V) -> T;
}

impl SizedPacker<
    T,
    +Into<u8, T>,
    +TryInto<T, u8>,
    +NumericLiteral<T>,
    +PartialEq<T>,
    +Zeroable<T>,
    +Rem<T>,
    +Add<T>,
    +Mul<T>,
    +Div<T>,
    +Drop<T>,
    +Copy<T>,
    U,
    +PartialEq<U>,
    +Into<u8, U>,
    +Into<U, u8>,
    +Drop<U>,
    +Copy<U>,
    V,
    +Into<V, T>,
    +Drop<V>,
    +Copy<V>,
> of SizedPackerTrait<T, U, V> {
    fn get(packed: T, index: u8, size: V, len: u8) -> U {
        let unpacked: Array<U> = Self::unpack(packed, size, len);
        *unpacked.at(index.into())
    }

    fn contains(mut packed: T, value: U, size: V, len: u8) -> bool {
        let modulo: T = size.into();
        let mut index = 0;
        loop {
            if index == len {
                break false;
            }
            let raw: u8 = (packed % modulo).try_into().unwrap();
            if value == raw.into() {
                break true;
            }
            packed = packed / modulo;
            index += 1;
        }
    }

    fn unpack(mut packed: T, size: V, len: u8) -> Array<U> {
        let mut result: Array<U> = array![];
        let modulo: T = size.into();
        let mut index = 0;
        loop {
            if index == len {
                break;
            }
            let value: u8 = (packed % modulo).try_into().unwrap();
            result.append(value.into());
            packed = packed / modulo;
            index += 1;
        };
        result
    }

    fn remove(mut packed: T, item: U, size: V, len: u8) -> T {
        // [Compute] Loop over the packed value and remove the value at the given index
        let mut removed = false;
        let mut result: Array<U> = array![];
        let mut idx: u8 = 0;
        let modulo: T = size.into();
        loop {
            if idx == len {
                break;
            }
            let value: u8 = (packed % modulo).try_into().unwrap();
            let current: U = value.into();
            if current != item {
                result.append(current);
            } else {
                removed = true;
            }
            idx += 1;
            packed = packed / modulo;
        };
        // [Check] Index not out of bounds
        assert(removed, errors::PACKER_ELEMENT_IS_MISSING);
        // [Return] The new packed value and the removed value
        Self::pack(result, size)
    }

    fn replace(mut packed: T, index: u8, size: V, value: U, len: u8) -> T {
        // [Compute] Loop over the packed value and remove the value at the given index
        let mut removed = false;
        let mut result: Array<U> = array![];
        let mut idx: u8 = 0;
        let modulo: T = size.into();
        loop {
            if idx == len {
                break;
            }
            let raw_value: u8 = (packed % modulo).try_into().unwrap();
            let item: U = raw_value.into();
            if idx != index {
                result.append(item);
            } else {
                result.append(value);
                removed = true;
            }
            idx += 1;
            packed = packed / modulo;
        };
        // [Check] Index not out of bounds
        assert(removed, errors::PACKER_ELEMENT_IS_MISSING);
        // [Return] The new packed value and the removed value
        Self::pack(result, size)
    }

    fn pack(mut unpacked: Array<U>, size: V) -> T {
        let mut result: T = Zeroable::zero();
        let mut modulo: T = size.into();
        let mut offset: T = 1_u8.into();
        loop {
            match unpacked.pop_front() {
                Option::Some(value) => {
                    let value_u8: u8 = value.into();
                    result = result + offset.into() * value_u8.into();
                    if unpacked.is_empty() {
                        break;
                    }
                    offset = offset * modulo;
                },
                Option::None => { break; }
            }
        };
        result
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;

    // Local imports

    use super::SizedPacker;

    #[test]
    fn test_packer_replace() {
        let packed: u64 = 0xab0598c6fe1234d7;
        let index: u8 = 8;
        let size: u8 = 16;
        let len: u8 = 16;
        let value: u8 = 0xa;
        let new_packed = SizedPacker::replace(packed, index, size, value, len);
        assert_eq!(new_packed, 0xab0598cafe1234d7);
    }

    #[test]
    fn test_packer_remove() {
        let packed: u64 = 0xab0598c6fe1234d7;
        let item: u8 = 0x6;
        let size: u8 = 16;
        let len: u8 = 16;
        let new_packed = SizedPacker::remove(packed, item, size, len);
        assert_eq!(new_packed, 0xab0598cfe1234d7);
    }
}

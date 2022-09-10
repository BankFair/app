import { oneHundredPercent } from '../constants'

/**
 * Takes a percentage as it is stored in the smart contracts and converts it to fractional percent
 */
export function convertPercent(value: number) {
    return (value / oneHundredPercent) * 100
}

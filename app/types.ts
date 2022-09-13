import { Tag } from 'taghiro'

export type Hexadecimal = string & Tag<'hexadecimal'>
export type InputAmount = '' | (string & Tag<'input-amount'>)
export type Address = string & Tag<'address'>

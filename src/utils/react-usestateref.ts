// https://github.com/Aminadav/react-useStateRef/blob/5b19d05935a7bf7c5c5d2c9098c99a4665a30fc2/index.ts

import { useCallback, useRef, useState, SetStateAction, Dispatch } from 'react'

const isFunction = <S>(setStateAction: SetStateAction<S>): setStateAction is (prevState: S) => S =>
  typeof setStateAction === 'function'

type ReadOnlyRefObject<T> = {
  readonly current: T
}

type UseStateRefValue<T> = [T, Dispatch<SetStateAction<T>>, ReadOnlyRefObject<T>]
type UseStateRef = {
  <S>(initialState: S | (() => S)): UseStateRefValue<S>
  <S = undefined>(): UseStateRefValue<S>
}

export const useStateRef: UseStateRef = <S>(initialState?: S | (() => S)) => {
  console.log('useStateRef', initialState)
  const [state, setState] = useState(initialState)
  const ref = useRef(state)

  const dispatch: typeof setState = useCallback((setStateAction: any) => {
    ref.current = isFunction(setStateAction) ? setStateAction(ref.current) : setStateAction

    setState(ref.current)
  }, [])

  return [state, dispatch, ref] as UseStateRefValue<S>
}

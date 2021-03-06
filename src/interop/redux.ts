import {IActionCall} from "../core/action"
import {onSnapshot, getSnapshot, applyAction, isModel} from "../index"
import {invariant, extend} from "../utils"

export interface IMiddleWareApi {
    getState: () => any
    dispatch: (action: any) => void
}

export interface IReduxStore extends IMiddleWareApi {
    subscribe(listener: (snapshot) => void)
}

export type MiddleWare =
    (middlewareApi: IMiddleWareApi) =>
        ((next: (action: IActionCall) => void) => void)

export function asReduxStore(model, ...middlewares: MiddleWare[]): IReduxStore {
    invariant(isModel(model), "Expected model object")
    let store: IReduxStore = {
        getState : ()       => getSnapshot(model),
        dispatch : action   => {
            runMiddleWare(action, runners.slice(), newAction => applyAction(model, reduxActionToAction(newAction)))
        },
        subscribe: listener => onSnapshot(model, listener)
    }
    let runners = middlewares.map(mw => mw(store))
    return store
}

function reduxActionToAction(action): IActionCall {
    const actionArgs = extend({}, action)
    delete actionArgs.type
    return {
        name: action.type,
        args: [actionArgs]
    }
}

function runMiddleWare(action, runners, next) {
    function n(retVal) {
        const f = runners.shift()
        if (f)
            f(n)(retVal)
        else
            next(retVal)
    }
    n(action)
}

/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import React from 'react';
import { connect as reduxConnect } from 'react-redux';

// The object exported by the currently loaded app.
let app;

// Cache of decorated components.
const decoratedComponents = {};

/**
 * Clear the decoreation cache. Used when loading
 * a real app from the file system is not possible, e.g. during unit
 * testing.
 *
 * @returns {void}
 */
function clearDecorationCache() {
    Object.keys(decoratedComponents).forEach(key => {
        delete decoratedComponents[key];
    });
}

/**
 * Set the app object to use for the current session. Used when loading
 * a real app from the file system is not possible, e.g. during unit
 * testing.
 *
 * @param {Object} appObj the app object to use.
 * @returns {void}
 */
function setApp(appObj) {
    app = appObj;
}

/**
 * Get app config object. Will be an empty object if the app does not specify this.
 *
 * @returns {Object} The config object given by the app.
 */
function getAppConfig() {
    return app.config || {};
}

/**
 * Invokes a function optionally defined by the loaded app.
 *
 * @param {string} name name of function
 * @param {...*} args argument list
 * @returns {undefined}
 */
function invokeAppFn(name, ...args) {
    if (!app) {
        throw new Error('Tried to invoke app function, but no app is loaded.');
    }
    if (typeof app[name] === 'function') {
        app[name](...args);
    }
}

function createDecoratedComponent(parent, name) {
    if (!app) {
        return parent;
    }

    let decorated = parent;
    const method = `decorate${name}`;
    const decorateFn = app[method];

    if (decorateFn) {
        try {
            decorated = decorateFn(parent, { React });
        } catch (err) {
            throw new Error(`Error when calling '${method}': ${err.message}`);
        }

        if (!decorated || typeof decorated !== 'function') {
            throw new Error(
                `Error when calling '${method}': ` +
                    `No React component found. The return value of '${method}' ` +
                    'must be a stateless functional component or a class that ' +
                    'implements render().'
            );
        }
    }
    return decorated;
}

function getDecorated(parent, name) {
    if (!decoratedComponents[name]) {
        decoratedComponents[name] = createDecoratedComponent(parent, name);
    }
    return decoratedComponents[name];
}

function mapToProps(mapSubject, coreMapFn, appMapFnName) {
    const coreProps = coreMapFn(mapSubject);
    if (!app) {
        return coreProps;
    }

    const appMapFn = app[appMapFnName];
    if (appMapFn) {
        if (typeof appMapFn !== 'function') {
            throw new Error(
                `Error when calling '${appMapFnName}': ` + 'Not a function.'
            );
        }

        try {
            return appMapFn(mapSubject, coreProps);
        } catch (err) {
            throw new Error(
                `Error when calling '${appMapFnName}': ${err.message}`
            );
        }
    }
    return coreProps;
}

/**
 * Decorates a reducer function. If the currently loaded app implements
 * a function named 'reduce{name}', then that is invoked right after
 * the given core reducer function.
 *
 * @param {function} coreReducerFn the core reducer function to decorate.
 * @param {string} name the name to look for in the currently loaded app.
 * @returns {function} decorated reducer function.
 */
function decorateReducer(coreReducerFn, name) {
    return (state, action) => {
        const coreState = coreReducerFn(state, action);
        if (!app) {
            return coreState;
        }

        const method = `reduce${name}`;
        const appReducerFn = app[method];

        if (appReducerFn) {
            if (typeof appReducerFn !== 'function') {
                throw new Error(
                    `Error when calling '${method}': ` + 'Not a function.'
                );
            }

            try {
                return appReducerFn(coreState, action);
            } catch (err) {
                throw new Error(
                    `Error when calling '${method}': ${err.message}`
                );
            }
        }
        return coreState;
    };
}

/**
 * Decorates a component. If the currently loaded app implements a function
 * named 'decorate{name}', then its return value is used instead of the given
 * component.
 *
 * @param {function|class} Component the component to decorate.
 * @param {string} name the name to look for in the currently loaded app.
 * @returns {function|class} decorated component.
 */
function decorate(Component, name) {
    return props => {
        const Sub = getDecorated(Component, name);
        return React.createElement(Sub, props);
    };
}

/**
 * Connects and decorates a component. Essentially a wrapper around the 'connect'
 * function from react-redux. If the currently loaded app implements functions
 * named 'map{name}Dispatch' or 'map{name}State', then these are invoked right
 * after coreMapStateFn or coreMapDispatchFn.
 *
 * @param {function} coreMapStateFn the core mapStateToProps function.
 * @param {function} coreMapDispatchFn the core mapDispatchToProps function.
 * @param {function} mergeProps see react-redux documentation.
 * @param {Object} options see react-redux documentation.
 * @returns {function} function that wraps 'connect' from react-redux.
 */
function connect(coreMapStateFn, coreMapDispatchFn, mergeProps, options = {}) {
    return (Component, name) =>
        reduxConnect(
            state => mapToProps(state, coreMapStateFn, `map${name}State`),
            dispatch =>
                mapToProps(dispatch, coreMapDispatchFn, `map${name}Dispatch`),
            mergeProps,
            options
        )(decorate(Component, name));
}

export {
    setApp,
    clearDecorationCache,
    decorateReducer,
    decorate,
    connect,
    getAppConfig,
    invokeAppFn,
};

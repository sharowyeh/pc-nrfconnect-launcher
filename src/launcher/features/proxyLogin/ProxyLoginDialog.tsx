/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useMemo, useState } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { ConfirmationDialog } from 'pc-nrfconnect-shared';

import { answerProxyLoginRequest } from '../../../ipc/proxyLogin';
import { useLauncherDispatch, useLauncherSelector } from '../../util/hooks';
import {
    changeUserName,
    getProxyLoginRequest,
    loginCancelledByUser,
    loginRequestSent,
} from './proxyLoginSlice';

export default () => {
    const dispatch = useLauncherDispatch();
    const [password, setPassword] = useState('');

    const { isVisible, username, host, requestIds } =
        useLauncherSelector(getProxyLoginRequest);

    const cancel = useCallback(() => {
        requestIds.forEach(id => answerProxyLoginRequest(id));
        dispatch(loginCancelledByUser());
    }, [dispatch, requestIds]);

    const login = useCallback(() => {
        requestIds.forEach(id =>
            answerProxyLoginRequest(id, username, password)
        );
        dispatch(loginRequestSent());
        setPassword('');
    }, [dispatch, password, requestIds, username]);

    const inputIsValid = useMemo(
        () => username !== '' && password !== '',
        [password, username]
    );

    const submitOnEnter: React.KeyboardEventHandler = useCallback(
        event => {
            if (event.key === 'Enter' && inputIsValid) {
                login();
            }
        },
        [inputIsValid, login]
    );

    return (
        <ConfirmationDialog
            isVisible={isVisible}
            title="Proxy authentication required"
            confirmLabel="Login"
            onConfirm={login}
            onCancel={cancel}
        >
            <p>
                The proxy server {host} requires authentication. Please enter
                username and password
            </p>
            <Form.Group controlId="username">
                <Form.Label>Username:</Form.Label>
                <InputGroup>
                    <Form.Control
                        autoFocus
                        value={username}
                        onChange={event =>
                            dispatch(changeUserName(event.target.value))
                        }
                        onKeyPress={submitOnEnter}
                    />
                </InputGroup>
            </Form.Group>
            <Form.Group controlId="password">
                <Form.Label>Password:</Form.Label>
                <InputGroup>
                    <Form.Control
                        value={password}
                        type="password"
                        onChange={event => setPassword(event.target.value)}
                        onKeyPress={submitOnEnter}
                    />
                </InputGroup>
            </Form.Group>
        </ConfirmationDialog>
    );
};

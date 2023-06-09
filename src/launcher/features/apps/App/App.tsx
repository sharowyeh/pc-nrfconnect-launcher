/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Col from 'react-bootstrap/Col';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';

import { isInstalled, isUpdatable, isWithdrawn } from '../../../../ipc/apps';
import { DisplayedApp } from '../appsSlice';
import AppIcon from './AppIcon';
import AppProgress from './AppProgress';
import CreateShortcut from './CreateShortcut';
import InstallApp from './InstallApp';
import InstallOtherVersion from './InstallOtherVersion';
import OpenApp from './OpenApp';
import OpenHomepage from './OpenHomepage';
import ShowReleaseNotes from './ShowReleaseNotes';
import UninstallApp from './UninstallApp';
import UpdateApp from './UpdateApp';

import styles from './app.module.scss';

const App = ({ app }: { app: DisplayedApp }) => {
    const itemRef = React.useRef<HTMLAnchorElement>(null);
    const [appIsInstalled, setAppIsInstalled] = useState<boolean>(
        isInstalled(app)
    );

    useEffect(() => {
        if (!itemRef.current) return;

        let timeout: NodeJS.Timeout;
        if (!appIsInstalled && isInstalled(app)) {
            itemRef.current.scrollIntoView();
            itemRef.current.classList.add(styles.highlight);
            timeout = setTimeout(
                () => itemRef.current?.classList.remove(styles.highlight),
                3000
            );
        }
        setAppIsInstalled(isInstalled(app));

        return () => {
            if (!timeout) return;
            clearTimeout(timeout);
        };
    }, [app, appIsInstalled]);

    return (
        <ListGroup.Item ref={itemRef}>
            <Row noGutters className="py-1">
                <Col xs="auto" className="d-flex align-items-start my-2 mr-3">
                    <AppIcon app={app} />
                </Col>
                <Col>
                    <div className="h8">{app.displayName || app.name}</div>
                    <div className="small text-muted">{app.description}</div>
                    <div className="small text-muted-more">
                        {app.source}
                        {isInstalled(app) && <>, v{app.currentVersion}</>}
                        {isUpdatable(app) && (
                            <> (v{app.latestVersion} available)</>
                        )}
                        {!isInstalled(app) &&
                            !isWithdrawn(app) &&
                            app.latestVersion && <>, v{app.latestVersion}</>}
                        {isWithdrawn(app) && (
                            <>, not available for download anymore</>
                        )}
                    </div>
                </Col>
                <Col
                    xs="auto"
                    className="d-flex align-items-center my-3 pl-3 ml-auto"
                >
                    <ButtonToolbar className="wide-btns">
                        <UpdateApp app={app} />
                        <OpenApp app={app} />
                        <InstallApp app={app} />
                        <DropdownButton
                            variant={
                                isInstalled(app)
                                    ? 'outline-primary'
                                    : 'outline-secondary'
                            }
                            title=""
                            alignRight
                        >
                            <OpenHomepage app={app} />
                            <ShowReleaseNotes app={app} />
                            <CreateShortcut app={app} />
                            <InstallOtherVersion app={app} />
                            <UninstallApp app={app} />
                        </DropdownButton>
                    </ButtonToolbar>
                </Col>
            </Row>
            <AppProgress app={app} />
        </ListGroup.Item>
    );
};

export default App;

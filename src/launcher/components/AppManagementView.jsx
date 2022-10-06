/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Iterable } from 'immutable';
import { bool, func, instanceOf, string } from 'prop-types';

import WithScrollbarContainer from '../containers/WithScrollbarContainer';
import AppFilterBar from '../features/filter/AppFilterBar';
import ReleaseNotesDialog from '../features/releaseNotes/ReleaseNotesDialog';
import AppItem from './AppItem';

const AppManagementView = ({
    apps,
    installingAppName,
    upgradingAppName,
    removingAppName,
    isProcessing,
    onInstall,
    onRemove,
    onReadMore,
    onAppSelected,
    onCreateShortcut,
    onShowReleaseNotes,
}) => (
    <>
        <AppFilterBar />
        <WithScrollbarContainer hasFilter>
            {apps.map(app => (
                <AppItem
                    key={`${app.name}-${app.source}`}
                    app={app}
                    isDisabled={isProcessing}
                    isInstalling={
                        installingAppName === `${app.source}/${app.name}`
                    }
                    isUpgrading={
                        upgradingAppName === `${app.source}/${app.name}`
                    }
                    isRemoving={removingAppName === `${app.source}/${app.name}`}
                    onRemove={() => onRemove(app.name, app.source)}
                    onInstall={() => onInstall(app.name, app.source)}
                    onReadMore={() => onReadMore(app.homepage)}
                    onAppSelected={() => onAppSelected(app)}
                    onCreateShortcut={() => onCreateShortcut(app)}
                    onShowReleaseNotes={() => onShowReleaseNotes(app)}
                />
            ))}
        </WithScrollbarContainer>

        <ReleaseNotesDialog />
    </>
);

AppManagementView.propTypes = {
    apps: instanceOf(Iterable).isRequired,
    installingAppName: string,
    upgradingAppName: string,
    removingAppName: string,
    isProcessing: bool,
    onInstall: func.isRequired,
    onRemove: func.isRequired,
    onReadMore: func.isRequired,
    onAppSelected: func.isRequired,
    onCreateShortcut: func.isRequired,
    onShowReleaseNotes: func.isRequired,
};

AppManagementView.defaultProps = {
    installingAppName: '',
    upgradingAppName: '',
    removingAppName: '',
    isProcessing: false,
};

export default AppManagementView;

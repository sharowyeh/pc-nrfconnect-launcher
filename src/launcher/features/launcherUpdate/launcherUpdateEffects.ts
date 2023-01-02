/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    describeError,
    ErrorDialogActions,
    logger,
} from 'pc-nrfconnect-shared';

import { downloadLatestAppInfos as downloadLatestAppInfosInMain } from '../../../ipc/apps';
import { cancelUpdate, checkForUpdate } from '../../../ipc/launcherUpdate';
import type { AppDispatch } from '../../store';
import {
    updateDownloadableAppInfos,
    updateDownloadableAppInfosFailed,
    updateDownloadableAppInfosStarted,
} from '../apps/appsSlice';
import { showUpdateCheckComplete } from '../settings/settingsSlice';
import { handleSourcesWithErrors } from '../sources/sourcesEffects';
import {
    cancelDownload as cancelLauncherDownload,
    reset,
    updateAvailable,
} from './launcherUpdateSlice';

export const checkForCoreUpdates = () => async (dispatch: AppDispatch) => {
    try {
        const { isUpdateAvailable, newVersion } = await checkForUpdate();

        if (isUpdateAvailable) {
            dispatch(updateAvailable(newVersion));
        } else {
            dispatch(reset());
        }
    } catch (error) {
        logger.warn(error);
    }
};

export const cancelDownload = () => (dispatch: AppDispatch) => {
    cancelUpdate();
    dispatch(cancelLauncherDownload());
};

export const downloadLatestAppInfos = () => async (dispatch: AppDispatch) => {
    try {
        dispatch(updateDownloadableAppInfosStarted());
        const latestAppInfos = await downloadLatestAppInfosInMain();
        dispatch(
            updateDownloadableAppInfos({ updatedAppInfos: latestAppInfos.apps })
        );
        handleSourcesWithErrors(latestAppInfos.sourcesFailedToDownload);
    } catch (error) {
        dispatch(updateDownloadableAppInfosFailed());
        dispatch(
            ErrorDialogActions.showDialog(
                `Unable to download latest app info: ${describeError(error)}`
            )
        );
    }
};

export const checkForUpdatesManually = () => async (dispatch: AppDispatch) => {
    try {
        await dispatch(downloadLatestAppInfos());
        dispatch(showUpdateCheckComplete());

        dispatch(checkForCoreUpdates());
    } catch (error) {
        ErrorDialogActions.showDialog(
            `Unable to check for updates: ${describeError(error)}`
        );
    }
};

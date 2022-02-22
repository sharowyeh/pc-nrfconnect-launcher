/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { require as remoteRequire } from '@electron/remote';
import semver from 'semver';

import launcherPackageJson from '../../../package.json';
import { App } from '../../main/apps';
import requiredVersionOfShared from '../../main/requiredVersionOfShared';

const config = remoteRequire('../main/config');

const isValidVersionNumber = (maybeVersionNumber?: string) =>
    semver.valid(maybeVersionNumber) != null;

const requestedVersionOfShared = (app: App) => app.sharedVersion;

interface LauncherCompatibilityConfig {
    providedVersionOfEngine: string;
    providedVersionOfShared: string;
}

const undecided = { isDecided: false } as const;
const compatible = { isDecided: true, isCompatible: true } as const;
const incompatible = (warning: string, longWarning: string) =>
    ({
        isDecided: true,
        isCompatible: false,
        warning,
        longWarning,
    } as const);

type Undecided = typeof undecided;
type Compatible = typeof compatible;
type Incompatible = ReturnType<typeof incompatible>;

type AppCompatibilityChecker = (
    app: App,
    launcherCompatibilityConfig: LauncherCompatibilityConfig
) => Undecided | Compatible | Incompatible;

export const checkEngineVersionIsSet: AppCompatibilityChecker = app =>
    app.engineVersion
        ? undecided
        : incompatible(
              'The app does not specify which nRF Connect for Desktop ' +
                  'versions it supports',
              'The app does not specify which nRF Connect for Desktop ' +
                  'versions it supports. Ask the app author to add an ' +
                  'engines.nrfconnect definition to package.json.'
          );

export const checkEngineIsSupported: AppCompatibilityChecker = (
    app,
    { providedVersionOfEngine }
) => {
    const isSupportedEngine = semver.satisfies(
        semver.coerce(providedVersionOfEngine) ?? '0.0.0',
        app.engineVersion! // eslint-disable-line @typescript-eslint/no-non-null-assertion -- checkEngineVersionIsSet above already checks that this is defined
    );

    return isSupportedEngine
        ? undecided
        : incompatible(
              'The app only supports nRF Connect for Desktop ' +
                  `${app.engineVersion}, which does not match your ` +
                  'currently installed version',
              'The app only supports nRF Connect for Desktop ' +
                  `${app.engineVersion} while your installed version is ` +
                  `${providedVersionOfEngine}. It might not work as expected.`
          );
};

export const checkIdenticalShared: AppCompatibilityChecker = (
    app,
    { providedVersionOfShared }
) =>
    requestedVersionOfShared(app) === providedVersionOfShared
        ? compatible
        : undecided;

export const checkProvidedVersionOfSharedIsValid: AppCompatibilityChecker = (
    app,
    { providedVersionOfShared }
) =>
    requestedVersionOfShared(app) == null ||
    isValidVersionNumber(providedVersionOfShared)
        ? undecided
        : incompatible(
              `nRF Connect for Desktop uses "${providedVersionOfShared}" of ` +
                  'the internal pc-nrfconnect-shared library which cannot ' +
                  'be checked against the version required by this app.',
              `nRF Connect for Desktop uses "${providedVersionOfShared}" of ` +
                  'the internal pc-nrfconnect-shared library which cannot ' +
                  'be checked against the version required by this app. ' +
                  'Inform the developer, that the launcher needs to ' +
                  'reference a correct version of pc-nrfconnect-shared. ' +
                  'The app might not work as expected.'
          );

export const checkRequestedVersionOfSharedIsValid: AppCompatibilityChecker =
    app => {
        return requestedVersionOfShared(app) == null ||
            isValidVersionNumber(requestedVersionOfShared(app))
            ? undecided
            : incompatible(
                  `The app requires "${requestedVersionOfShared(app)}" of ` +
                      'the internal pc-nrfconnect-shared library which ' +
                      'cannot be checked against the version provided by ' +
                      'nRF Connect for Desktop.',
                  `The app requires "${requestedVersionOfShared(app)}" of ` +
                      'the internal pc-nrfconnect-shared library which ' +
                      'cannot be checked against the version provided by ' +
                      'nRF Connect for Desktop. Inform the developer, that ' +
                      'the app needs to reference a correct version of ' +
                      'pc-nrfconnect-shared. The app might not work as ' +
                      'expected.'
              );
    };

export const checkRequestedSharedIsProvided: AppCompatibilityChecker = (
    app,
    { providedVersionOfShared }
) => {
    const requestedVersionOfSharedByApp = requestedVersionOfShared(app);
    const providesRequestedVersionOfShared =
        requestedVersionOfSharedByApp == null ||
        semver.lte(requestedVersionOfSharedByApp, providedVersionOfShared!); // eslint-disable-line @typescript-eslint/no-non-null-assertion

    return providesRequestedVersionOfShared
        ? undecided
        : incompatible(
              `The app requires ${requestedVersionOfShared(app)} of the ` +
                  'internal pc-nrfconnect-shared library, but your version ' +
                  'of nRF Connect for Desktop only provided ' +
                  `${providedVersionOfShared}`,
              `The app requires ${requestedVersionOfShared(app)} of the ` +
                  'internal pc-nrfconnect-shared library, but your version ' +
                  'of nRF Connect for Desktop only provided ' +
                  `${providedVersionOfShared}. Upgrading nRF Connect for ` +
                  'Desktop might help. Inform the app developer, that the ' +
                  'app needs a more recent version of nRF Connect for ' +
                  'Desktop. The app might not work as expected.'
          );
};

const getProvidedVersionOfShared = () => {
    const providedVersionOfShared =
        requiredVersionOfShared(launcherPackageJson);

    if (providedVersionOfShared == null) {
        throw new Error(
            'The launcher must depend on a version of pc-nrfconnect-shared'
        );
    }

    return providedVersionOfShared;
};

export default (
    app: App,
    launcherCompatibilityConfig = {
        providedVersionOfEngine: config.getVersion(),
        providedVersionOfShared: getProvidedVersionOfShared(),
    }
): Compatible | Incompatible => {
    // eslint-disable-next-line no-restricted-syntax -- because here a loop is simpler than an array iteration function
    for (const check of [
        checkEngineVersionIsSet,
        checkEngineIsSupported,
        checkIdenticalShared,
        checkProvidedVersionOfSharedIsValid,
        checkRequestedVersionOfSharedIsValid,
        checkRequestedSharedIsProvided,
    ]) {
        const result = check(app, launcherCompatibilityConfig);
        if (result.isDecided) {
            return result;
        }
    }

    return compatible;
};

import Site from 'lume/core/site.ts';
import { dirname } from 'std/path/mod.ts';
import { afterEach, beforeEach, describe, it } from 'std/testing/bdd.ts';
import {
  assertSpyCallArg,
  assertSpyCalls,
  Stub,
  stub,
} from 'std/testing/mock.ts';
import { assets } from './config.ts';

import theModule from './mod.ts';

const baseUrl = dirname(import.meta.url);

describe('module', () => {
  let fakeSite: Site;
  let stubs: Stub[];

  beforeEach(() => {
    fakeSite = new Site();
    stubs = [stub(fakeSite, 'remoteFile'), stub(fakeSite, 'copy')];
  });

  afterEach(() => {
    stubs.forEach((s) => s.restore());
  });

  it('should load remote files', () => {
    theModule()(fakeSite);

    assertSpyCalls(<Stub>fakeSite.remoteFile, 4);
    assertSpyCallArg(<Stub>fakeSite.remoteFile, 0, 0, `/assets/${assets[0]}`);
    assertSpyCallArg(
      <Stub>fakeSite.remoteFile,
      0,
      1,
      `${baseUrl}/assets/${assets[0]}`,
    );
  });

  it('should copy each file separately', () => {
    theModule()(fakeSite);

    assertSpyCalls(<Stub>fakeSite.copy, 4);
    assertSpyCallArg(<Stub>fakeSite.copy, 0, 0, `/assets/${assets[0]}`);
  });

  it('should allow asset path to be set', () => {
    theModule({
      assetPath: '/fakePath',
    })(fakeSite);

    assertSpyCallArg(<Stub>fakeSite.remoteFile, 0, 0, `/fakePath/${assets[0]}`);
    assertSpyCallArg(
      <Stub>fakeSite.remoteFile,
      0,
      1,
      `${baseUrl}/assets/${assets[0]}`,
    );
    assertSpyCallArg(<Stub>fakeSite.copy, 0, 0, `/fakePath/${assets[0]}`);
  });

  it('should allow remove trailing slashes from the asset path to be set', () => {
    theModule({
      assetPath: '/fakePath////',
    })(fakeSite);

    assertSpyCallArg(<Stub>fakeSite.remoteFile, 0, 0, `/fakePath/${assets[0]}`);
    assertSpyCallArg(<Stub>fakeSite.copy, 0, 0, `/fakePath/${assets[0]}`);
  });
});
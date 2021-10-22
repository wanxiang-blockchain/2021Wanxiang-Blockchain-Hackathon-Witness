import { expect } from 'chai';
import { BigNumber, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { SPACE_INFO, PROPOSAL_INFO, Space, Proposal } from './Utils';
import { Controller } from '../typechain/Controller';
import { stringToHex } from 'web3-utils';

const jsonObjToHex = (data: Space | Proposal) => {
  return stringToHex(JSON.stringify(data));
};

async function deploy(): Promise<Controller> {
  const deployerOrDefault = (await ethers.getSigners())[0];

  const contractFactory = await ethers.getContractFactory('Controller', {
    signer: deployerOrDefault,
    libraries: {},
  });
  const contract = (await contractFactory.deploy()) as Controller;

  await contract.deployed();
  await contract.initialize();
  return contract;
}

describe('Controller', () => {
  const token = '0xA5fa77e87c27B92686970017896A91ADd1c26130';
  const baseSpace = 1 << 20;
  let controller: Controller;
  let accounts: Signer[];

  beforeEach(async () => {
    accounts = await ethers.getUnnamedSigners();
    // see deploy/001_controller.ts
    controller = await deploy();
  });

  it('should add workspace ok', async () => {
    const data = jsonObjToHex(SPACE_INFO);
    await controller.addWorkspace(token, data);
    const workspace = await controller.workspaces(baseSpace);
    expect(workspace.additionalData).to.eq(data);
  });

  it('should add proposal ok', async () => {
    await controller.addWorkspace(token, jsonObjToHex(SPACE_INFO));

    const startTime = Date.now();
    const endTime = startTime + 100;
    const snapshot = 200;
    const data = jsonObjToHex(PROPOSAL_INFO);
    await controller.addProposal(baseSpace, startTime, endTime, snapshot, data);
    await controller.addProposal(baseSpace, startTime, endTime, snapshot + 1, data);

    const workspace = await controller.workspaces(baseSpace);

    // get second proposal
    const proposal = await controller.proposals(workspace.pros);
    expect(proposal.start.toString()).be.eq(startTime.toString());
    expect(proposal.end.toString()).to.eq(endTime.toString());
    expect(proposal.snapshot.toString()).to.eq((snapshot + 1).toString());
    expect(proposal.data).to.eq(data);
  });

  it('should add and remove finalizer ok', async () => {
    const one = accounts[0];
    const two = accounts[1];

    const signer = await ethers.getNamedSigner('deployer');

    await controller.connect(signer).addFinalizer(await one.getAddress());
    await controller.connect(signer).addFinalizer(await two.getAddress());

    expect(await controller.connect(signer).finalizers(await one.getAddress())).to.eq(true);
    expect(await controller.connect(signer).finalizers(await two.getAddress())).to.eq(true);

    await controller.connect(signer).removeFinalizer(await one.getAddress());
    expect(await controller.connect(signer).finalizers(await one.getAddress())).to.eq(false);
  });

  it('should submit vote ok', async () => {
    await controller.addWorkspace(token, jsonObjToHex(SPACE_INFO));

    const startTime = Date.now();
    const endTime = startTime + 100;
    const snapshot = 200;
    const data = jsonObjToHex(PROPOSAL_INFO);
    await controller.addProposal(baseSpace, startTime, endTime, snapshot, data);

    const validator = accounts[0];
    const proposalId = baseSpace + 1;
    const result = ['0x11', '0x23', '0x33'].map((v) => BigNumber.from(v));
    const signer = await ethers.getNamedSigner('deployer');
    await controller.connect(signer).addFinalizer(await validator.getAddress());
    await controller.connect(validator).submitVotes(proposalId, result);
    expect(await controller.getProposalOptions(proposalId)).deep.equals(result);
  });

  it('should add admins, reset app, then permanently kills the reset feature', async () => {
    // add a workspace and a proposal.
    await controller.addWorkspace(token, jsonObjToHex(SPACE_INFO));
    const startTime = Date.now();
    const endTime = startTime + 100;
    const snapshot = 200;
    const data = jsonObjToHex(PROPOSAL_INFO);
    await controller.addProposal(baseSpace, startTime, endTime, snapshot, data);

    const admin = accounts[0];
    const signer = await ethers.getNamedSigner('deployer');

    await controller.connect(signer).addAdmin(await admin.getAddress());
    expect(await controller.connect(signer).admins(await admin.getAddress())).to.eq(true);

    // resetting the app.
    await controller.connect(admin).resetApp();
    expect((await controller.connect(signer).currentSpace()).toString()).to.eq('0');

    // revokes the admin
    await controller.connect(signer).revokeAdmin(await admin.getAddress());
    expect(await controller.connect(signer).admins(await admin.getAddress())).to.eq(false);

    // attempts to assign new admin -- expected to fail.
    try {
      await controller.connect(signer).addAdmin(await admin.getAddress());
    } catch (error) {
      expect(true);
    }

    expect(await controller.connect(signer).admins(await admin.getAddress())).to.eq(false);
  });
});

import { expect } from 'chai';
import { ethers, deployments } from 'hardhat';
import { abi as controllerAbi } from '../artifacts/contracts/Controller.sol/Controller.json';
import { abi as testAbi } from '../artifacts/contracts/ControllerTest.sol/ControllerTest.json';
import { Controller } from '../typechain';

async function deployController(): Promise<Controller> {
  const { deployer } = await ethers.getNamedSigners();

  const contractFactory = await ethers.getContractFactory('ControllerTest', {
    signer: deployer,
    libraries: {},
  });

  const contract = (await contractFactory.deploy()) as Controller;
  await contract.deployed();

  return contract;
}

describe('Proxy and Upgrade Test', () => {
  beforeEach(async () => {
    // trigger deploy action using tag `Proxy`
    await deployments.fixture('Proxy');
  });

  it('should add and remove finalizer ok via the proxy', async () => {
    const accounts = await ethers.getUnnamedSigners();
    const one = accounts[0];
    const two = accounts[1];

    const deployer = await ethers.getNamedSigner('deployer');
    const proxy = await ethers.getContract('OwnedUpgradeabilityProxy', deployer);
    const proxyV1 = await ethers.getContractAt(controllerAbi, proxy.address, deployer);

    await proxyV1.connect(deployer).addFinalizer(await one.getAddress());
    await proxyV1.connect(deployer).addFinalizer(await two.getAddress());

    expect(await proxyV1.connect(deployer).finalizers(await one.getAddress())).to.eq(true);
    expect(await proxyV1.connect(deployer).finalizers(await two.getAddress())).to.eq(true);

    await proxyV1.connect(deployer).removeFinalizer(await one.getAddress());
    expect(await proxyV1.connect(deployer).finalizers(await one.getAddress())).to.eq(false);
  });

  it('should be able to upgrade the contract', async () => {
    const baseSpace = 1 << 20;

    const deployer = await ethers.getNamedSigner('deployer');
    const proxy = await ethers.getContract('OwnedUpgradeabilityProxy', deployer);

    const controllerV2: Controller = await deployController();
    const proxyV2 = await ethers.getContractAt(testAbi, proxy.address, deployer);
    const proxyAdmin = await ethers.getNamedSigner('proxyAdmin');
    await proxy.connect(proxyAdmin).upgradeTo(controllerV2.address);

    await proxyV2.connect(deployer).addWorkspace('0xA5fa77e87c27B92686970017896A91ADd1c26130', ethers.utils.hexlify(1));
    expect((await controllerV2.connect(deployer).currentSpace()).toString()).eq('0');
    expect((await proxyV2.connect(deployer).currentSpace()).toString()).to.eq(baseSpace.toString());

    // new features
    console.log(await proxyV2.connect(deployer).test());
  });
});

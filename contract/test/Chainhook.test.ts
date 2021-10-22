import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, BigNumber } from 'ethers';
import { solidity } from 'ethereum-waffle';
import { TestGeode } from '../typechain/TestGeode';

chai.use(solidity);

async function deploy(): Promise<TestGeode> {
  const { deployer } = await ethers.getNamedSigners();
  const Geode = await ethers.getContractFactory('TestGeode', {
    signer: deployer,
    libraries: {},
  });
  const geode = (await Geode.deploy()) as TestGeode;
  await geode.deployed();

  return geode;
}

describe('Chainhook test', () => {
  let accounts: Signer[];
  let instance: TestGeode;
  let signer: Signer;

  before(async () => {
    instance = await deploy();
    accounts = await ethers.getUnnamedSigners();
    const { deployer } = await ethers.getNamedSigners();
    signer = deployer;
  });

  it('should flag non-authorized callers', async () => {
    await expect(instance.connect(signer).setOneInt(BigNumber.from(5))).to.be.revertedWith('Geode Caller only');
  });

  it('should give access to a trusted validator', async () => {
    const caller = accounts[0];
    const addr = await caller.getAddress();
    await instance.connect(signer).modifyValidator(addr, true);
    expect(await instance.connect(signer).validators(addr)).to.be.true;
  });

  it('should set a single number and a list of numbers', async () => {
    const caller = accounts[0];
    const x = 69;
    const nice = ['420', '69'];
    const nice_bn = nice.map((num) => {
      return BigNumber.from(num);
    });

    // set single number
    await instance.connect(caller).setOneInt(x);
    expect(await instance.connect(signer).someInt()).to.be.equal(x);

    // set multiple numbers.
    await instance.connect(caller).setMultipleInt(nice_bn);
    for (let i = 0; i < nice.length; i++) {
      expect((await instance.connect(signer).someIntArr(BigNumber.from(i))).toString()).to.be.equal(nice[i]);
    }
  });

  it('should set stored by reference variables (strings)', async () => {
    const caller = accounts[0];
    const str = 'hello, world!';
    const boo = false;

    await instance.connect(caller).setBool(boo);
    await instance.connect(caller).setStr(str);

    expect(await instance.connect(signer).someBool()).to.be.equal(boo);
    expect(await instance.connect(signer).someStr()).to.be.equal(str);
  });

  it('should be able to pass all other setters', async () => {
    const caller = accounts[0];

    const x = await instance.connect(signer).someInt();
    const arr = ['420', '69'];
    const str = await instance.connect(signer).someStr();
    const boo = await instance.connect(signer).someBool();

    const strChanged = 'OMG, you changed!';
    const booChanged = true;
    const y = 4;
    const changedArr = ['1', '2', '3'];
    const changedArrBn = changedArr.map((num) => {
      return BigNumber.from(num);
    });

    await instance.connect(caller).setOneIntThenStr(BigNumber.from(y), strChanged);
    expect(await instance.connect(caller).someInt()).to.not.equal(x);
    expect(await instance.connect(caller).someInt()).to.equal(y);
    expect(await instance.connect(caller).someStr()).to.not.equal(str);
    expect(await instance.connect(caller).someStr()).to.equal(strChanged);

    await instance.connect(caller).setMultIntThenBool(changedArrBn, booChanged);
    for (let i = 0; i < changedArr.length; i++) {
      expect((await instance.connect(signer).someIntArr(BigNumber.from(i))).toString()).to.be.equal(changedArr[i]);
      expect((await instance.connect(signer).someIntArr(BigNumber.from(i))).toString()).to.be.not.equal(arr[i]);
    }
  });
});

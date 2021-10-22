// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import '@openzeppelin/contracts/access/Ownable.sol';

contract TestGeode is Ownable {
    // contract state
    uint256 public someInt;
    uint256[] public someIntArr;
    string public someStr;
    bool public someBool;

    // protocol state
    mapping(address => bool) public validators;

    // modifier to verify caller is a Geode-approved address.
    modifier onlyValidator() {
        require(validators[msg.sender], 'Geode Caller only');
        _;
    }

    // setters

    /**
     * Function to authorize or revoke validator.
     * @param _validator - the input address
     * @param _assignPrivilege - true - to grant authorization, false - to revoke authorization
     */
    function modifyValidator(address _validator, bool _assignPrivilege)
        public
        onlyOwner()
    {
        validators[_validator] = _assignPrivilege;
    }

    function setOneInt(uint256 _x) public onlyValidator() {
        someInt = _x;
    }

    function setMultipleInt(uint256[] memory _arr) public onlyValidator() {
        someIntArr = _arr;
    }

    function setStr(string memory _str) public onlyValidator() {
        someStr = _str;
    }

    function setBool(bool _b) public onlyValidator() {
        someBool = _b;
    }

    function setBoolThenStr(bool _isBool, string memory _str)
        public
        onlyValidator()
    {
        someBool = _isBool;
        someStr = _str;
    }

    function setOneIntThenBool(uint256 _x, bool _b) public onlyValidator() {
        someInt = _x;
        someBool = _b;
    }

    function setOneIntThenStr(uint256 _x, string memory _str)
        public
        onlyValidator()
    {
        someInt = _x;
        someStr = _str;
    }

    function setMultIntThenBool(uint256[] memory _arr, bool _b)
        public
        onlyValidator()
    {
        someIntArr = _arr;
        someBool = _b;
    }

    function setMultIntThenStr(uint256[] memory _arr, string memory _str)
        public
        onlyValidator()
    {
        someIntArr = _arr;
        someStr = _str;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleEscrow {
    mapping(address => mapping(address => uint256)) public deposits;

    event Deposited(address indexed sender, address indexed receiver, uint256 amount);
    event Released(address indexed sender, address indexed receiver, uint256 amount);
    event Refunded(address indexed sender, address indexed receiver, uint256 amount);

    function deposit(address _receiver) external payable {
        require(msg.value > 0, "Must send Ether");

        deposits[msg.sender][_receiver] += msg.value;

        emit Deposited(msg.sender, _receiver, msg.value);
    }

    function releaseFunds(address _receiver) external  {
        uint256 amount = deposits[msg.sender][_receiver];
        require(amount > 0, "No funds available");

        deposits[msg.sender][_receiver] = 0;
        
        // Use `.call` instead of `.transfer`
        (bool success, ) = payable(_receiver).call{value: amount}("");
        require(success, "Transfer failed");

        emit Released(msg.sender, _receiver, amount);
    }

    function refund(address _receiver) external {
        uint256 amount = deposits[msg.sender][_receiver];
        require(amount > 0, "No funds to refund");

        deposits[msg.sender][_receiver] = 0;
        
        // Use `.call` instead of `.transfer`
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund failed");

        emit Refunded(msg.sender, _receiver, amount);
    }

    function getDeposit(address _sender, address _receiver) external view returns (uint256) {
        return deposits[_sender][_receiver];
    }
}

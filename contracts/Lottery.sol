pragma solidity >=0.4.22 <0.9.0;

contract Lottery{
    struct BetInfo {
        uint256 answerBlockNumber;
        address payable bettor;
        byte challenges; //0xab
        
    }
    uint256 private _tail;
    uint256 private _head;
    mapping (uint256 => BetInfo) private _bets;
    address public owner;
    uint256 constant internal BLOCK_LIMIT = 256;
    uint256 constant internal BET_BLOCK_INTERVAL = 3;
    uint256 constant internal BET_AMOUNT = 5 * 10 ** 15;
    uint256 private _pot;

    event BET(uint256 index, address bettor, uint256 amount, byte challenges, uint256 answerBlockNumber);

    constructor() public{
        owner = msg.sender;

    }


    function getPot() public view returns (uint256 pot) {
        return  _pot;

    }
    
    /**
    * @dev 배팅을 한다. 유저는 0.005 ETH 를 보내야하고 배팅을 1byte 글자를 보낸다.
    * 뷰에 저장된 배팅정보는 distrubute 함수에서 해결된다.
    * @param challenges 유저가 배팅하는 글자
    * @return 함수가 잘 수행되었는지 확인하는 bool 값    
     */
    function bet(byte challenges) public payable returns (bool result){

        // check Money proper ether is sent
        require(msg.value == BET_AMOUNT,"Not enuogh ETH");

        // push bet to the queue
        require(pushBet(challenges),"Fail to add a new Bet Info");

        // event log
        emit BET(_tail -1,msg.sender,msg.value,challenges,block.number + BET_BLOCK_INTERVAL);


        return true;


    }
        //save the bet to the queue

    //distribute
        // check ther answer
    
    function getBetInfo(uint256 index) public view returns (uint answerBlockNumber, address bettor, byte challenges){
        BetInfo memory b= _bets[index];
        answerBlockNumber = b.answerBlockNumber;
        bettor =  b.bettor;
        challenges = b.challenges;

    }
    

    function pushBet(byte challenges) internal returns (bool){
        BetInfo memory b;
        b.bettor = msg.sender;
        b.answerBlockNumber = block.number + BET_BLOCK_INTERVAL;
        b.challenges = challenges;

        _bets[_tail] = b;
        _tail++;

        return true;

    }

    function popBet(uint256 index) internal returns (bool){
        delete _bets[index];
        return true;
    }
}
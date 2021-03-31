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

    bool private mode = false; // false : test mode , true : real BlockHash
    bytes32 public answerForTest;

    enum BlockStatus { Checkable,NotRevealed, BlockPassed }
    enum BettingResult {fail, win, draw}
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
    function distribute() public{
        //head  3 4 5 6 7 8 9 10 tail >>

        uint256 cur;
        BetInfo memory b ;
        BettingResult currentBettingResult;
        for(cur=_head;cur<_tail;cur++){
            b= _bets[cur];
            BlockStatus currentBlockStatus;

            currentBlockStatus = getBlockStatus(b.answerBlockNumber);
            // checkable : block.number > AnswerBlockNumber && block.number < BLOCK_LIMIT + ANswerBlockNumber 1 
            if(currentBlockStatus == BlockStatus.Checkable){
                currentBettingResult = isMatch(b.challenges, getAnswerBlockHash(b.answerBlockNumber));
                // WIN , bettor gets pot

                // FAIL ,  bettor's money goes pot

                // DRAW,   retund bettor' money
            }

            // No Revealed: block.number <=AnswerBlockNumber  2 
            if(currentBlockStatus == BlockStatus.NotRevealed){
              break;
            }

            // Block Limit Passed : block.number >= AnswerBlockNumber + BLOCK_LIMIT  3    
            if(currentBlockStatus == BlockStatus.BlockPassed){
                // refund
                // emit refund
            }
             popBet(cur);
             // check ther answer
        }

    }
    function setAnswerForTest(bytes32 answer)public  returns (bool result){
        answerForTest = answer;
        return true;
    }
    function getAnswerBlockHash(uint256 answerBlockNumber) internal view returns (bytes32 answer){
        return mode ? blockhash(answerBlockNumber) : answerForTest:

    }
    /**
    * @dev 배팅글자와 정답 확인
    * @param challenges; 배팅 글자
    * @param answer 블락해쉬
    * @return 정답결과        
     */
    function isMatch(byte challenges, bytes32 answer) public pure returns (BettingResult){
        //challenges 0xab
        // answer 0xab.........ff 32 bytes
        
        byte c1 = challenges;
        byte c2 = challenges;

        byte a1 = answer[0];
        byte a2 = answer[0];

        // Get first number
        c1 = c1 >> 4; //oxab ->0x0a
        c1 = c1 << 4; //ox0a ->0xa0

        a1 = a1 >>4;
        a1 = a1 <<4;

        // Get Second Number;
        c2 = c2<<4; // 0xab -> 0xb0
        c2 = c2>>4; // 0xb0 -> 0x0b

        a2 = a2<<4;
        a2 = a2>>4;

        if(a1 == c1 && a2 == c2){
            return BettingResult.win;

        }
        if(a1 == c1 || a2 == c2){
            return BettingResult.draw;

        }
        return BettingResult.fail;

    }
    function getBlockStatus(uint256 answerBlockNumber ) internal view returns (BlockStatus){
        if(block.number > answerBlockNumber && block.number < BLOCK_LIMIT + answerBlockNumber){
            return BlockStatus.Checkable;
        }
        if( block.number <= answerBlockNumber){
            return BlockStatus.NotRevealed;
        }
        if(block.number >= answerBlockNumber + BLOCK_LIMIT){
            return BlockStatus.BlockPassed;
        }
        return BlockStatus.BlockPassed;
    }
    
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
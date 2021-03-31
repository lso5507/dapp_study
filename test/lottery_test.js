const { assert } = require("chai");
const _deploy_smtart_contract = require("../migrations/2_deploy_smtart_contract");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");
const Lottery = artifacts.require("Lottery");

contract('Lottery',function([deployer,user1,user2]){
    let lottery;
    let betAmount = 5 *10 **15;
    let bet_block_intertval = 3
    beforeEach(async()=>{
        lottery = await Lottery.new();

    })
    it('getPot should return current pot Test,',async()=>{
        console.log("Basic Test");
        let pot =  await lottery.getPot();
        assert.equal(pot,0)
    })
    describe("Bet",function(){
        it('should fail when the bet money is not 0.005 ETH,',async()=>{
            // Fail transection
            await assertRevert(lottery.bet('0xab',{from:user1, value:4000000000000000}))

            //transaction object  {chainid , value, to,from, gas(Limit), gasPrice}
        })
        it('should put the bet to the bet queue with 1 bet,',async()=>{
            // bet
            let receipt = await lottery.bet('0xab',{from:user1, value:betAmount})
         //   console.log(receipt);

            let pot = await lottery.getPot();
            assert.equal(pot,0);
            // check contract Balance => 0.005
            let contractBalance = await web3.eth.getBalance(lottery.address)
            assert.equal(contractBalance,betAmount)

            // check bet Info
            let currentBlockNumber = await web3.eth.getBlockNumber();
            let bet = await lottery.getBetInfo(0);
            assert.equal(bet.answerBlockNumber, currentBlockNumber+bet_block_intertval)
            assert.equal(bet.bettor, user1)
            assert.equal(bet.challenges, '0xab')
            // check log (EVENT)
            await expectEvent.inLogs(receipt.logs,"BET")
        })
    })

    describe.only('isMatch',function(){
        it('should be BettingResult.Win when two characters match', async() =>{
            let blockhash = '0xab5be999ccc07bec74805e3c19c659422ad54e2c5be1110251625cc89d5cbf4e';
            let matchingResult = await lottery.isMatch('0xab',blockhash)
            assert.equal(matchingResult,1);
        })
        it('should be BettingResult.Fail when two characters match', async() =>{
            let blockhash = '0xab5be999ccc07bec74805e3c19c659422ad54e2c5be1110251625cc89d5cbf4e';
            let matchingResult = await lottery.isMatch('0xcd',blockhash)
            assert.equal(matchingResult,0);
        })
        it('should be BettingResult.Draw when two characters match', async() =>{
            let blockhash = '0xab5be999ccc07bec74805e3c19c659422ad54e2c5be1110251625cc89d5cbf4e';
            let matchingResult = await lottery.isMatch('0xa0',blockhash)
            assert.equal(matchingResult,2);

            matchingResult = await lottery.isMatch('0xfb',blockhash)
            assert.equal(matchingResult,2);
        })
    })
});
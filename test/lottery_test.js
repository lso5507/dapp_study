const { assert } = require("chai");
const _deploy_smtart_contract = require("../migrations/2_deploy_smtart_contract");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");
const Lottery = artifacts.require("Lottery");

contract('Lottery',function([deployer,user1,user2]){
    let lottery;
    let betAmount = 5 *10 **15;
    let bet_block_intertval = 3
    let betAmountBN = new web3.utils.BN('5000000000000000')
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
    describe('Distribute',function(){
        describe('When the answer is checkable', function(){
            it('should give the user the pot when the answer matches,',async()=>{
                //두 글자 다 맞았을 때
                await lottery.setAnswerForTest('0xab5be999ccc07bec74805e3c19c659422ad54e2c5be1110251625cc89d5cbf4e',{from:deployer})
                let user1BalanceTest = await web3.eth.getBalance(user1);
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 1 -> 4
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 2 -> 5
                console.log(user1BalanceTest)
                await lottery.betAndDistrubute('0xab',{from:user1,value:betAmount}) // 3 -> 6
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 4 -> 7
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 5 -> 8
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 6 -> 9 
                let potBefore = await lottery.getPot(); // == 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                //assert.equal(new web3.utils.BN(user1BalanceTest).toString(),new web3.utils.BN(user1BalanceBefore).add(betAmountBN).toString());
                let receipt7= await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 7 -> 10 //user1에게 pot이 간다
                

                let potAfter = await lottery.getPot();
                let user1BalanceAfter = await web3.eth.getBalance(user1); // == before + 0.015 ETH

                //pot 변화량 확인
                assert.equal(potBefore.toString(),new web3.utils.BN('10000000000000000').toString());
                assert.equal(potAfter.toString(),new web3.utils.BN('0').toString());

                // user(winer)의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                
                
               assert.equal(user1BalanceBefore.add(potBefore).add(betAmountBN).toString(),new web3.utils.BN(user1BalanceAfter).toString()) ;
            })
            it('should give the user the amount he or she bet when a single character matchs,',async()=>{
                //한 글자 맞았을 때
                await lottery.setAnswerForTest('0xab5be999ccc07bec74805e3c19c659422ad54e2c5be1110251625cc89d5cbf4e',{from:deployer})
                let user1BalanceTest = await web3.eth.getBalance(user1);
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 1 -> 4
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 2 -> 5
                console.log(user1BalanceTest)
                await lottery.betAndDistrubute('0xaf',{from:user1,value:betAmount}) // 3 -> 6
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 4 -> 7
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 5 -> 8
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 6 -> 9 
                let potBefore = await lottery.getPot(); // == 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                //assert.equal(new web3.utils.BN(user1BalanceTest).toString(),new web3.utils.BN(user1BalanceBefore).add(betAmountBN).toString());
                let receipt7= await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 7 -> 10 //user1에게 pot이 간다
                

                let potAfter = await lottery.getPot(); // 0.01 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1); // == before + 0.005 ETH

                //pot 변화량 확인
                assert.equal(potBefore.toString(),potAfter.toString());
                

                // user(winer)의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                
                
               assert.equal(user1BalanceBefore.add(betAmountBN).toString(),new web3.utils.BN(user1BalanceAfter).toString()) ;
            })
            it.only('should get the eth or user when the answer does not match at all ,',async()=>{
                //다 틀렸을때
                await lottery.setAnswerForTest('0xab5be999ccc07bec74805e3c19c659422ad54e2c5be1110251625cc89d5cbf4e',{from:deployer})
                let user1BalanceTest = await web3.eth.getBalance(user1);
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 1 -> 4
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 2 -> 5
                console.log(user1BalanceTest)
                await lottery.betAndDistrubute('0xef',{from:user1,value:betAmount}) // 3 -> 6
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 4 -> 7
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 5 -> 8
                await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 6 -> 9 
                let potBefore = await lottery.getPot(); // == 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                //assert.equal(new web3.utils.BN(user1BalanceTest).toString(),new web3.utils.BN(user1BalanceBefore).add(betAmountBN).toString());
                let receipt7= await lottery.betAndDistrubute('0xef',{from:user2,value:betAmount}) // 7 -> 10 //user1에게 pot이 간다
                

                let potAfter = await lottery.getPot(); // 0.01 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1); // == before ETH

                //pot 변화량 확인
                assert.equal(potBefore.add(betAmountBN).toString(),potAfter.toString());
                

                // user(winer)의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                
                
               assert.equal(user1BalanceBefore.toString(),new web3.utils.BN(user1BalanceAfter).toString()) ;


            })
        })
        describe('When the answer is not revealed(Not Minned)', function(){
            
        })
        describe('When the answer is not revealed(Block Limit is passed)', function(){
            
        })

    })

    describe('isMatch',function(){
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
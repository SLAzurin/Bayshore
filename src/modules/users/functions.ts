import { Config } from "../../config";
import { prisma } from "../..";

// Import Proto
import { wm } from "../../wmmt/wm.proto";
import * as wmproto from "../../wmmt/wm.proto";

// Import Util
import * as scratch from "../terminal/scratch";


// User not yet Exist
export async function userNotYetExist(body: wm.protobuf.LoadUserRequest, message: any)
{
    let msg = message;
    
    // Check if new card registration is allowed or not
    let newCardsBanned = Config.getConfig().gameOptions.newCardsBanned || 0;

    // New card registration is allowed
    if(newCardsBanned === 0)
    {
        // TUTORIAL_ID_GHOST_STAMP (20, 21, 22) must true, if false the game will get soft locked
        // Create User Data
        let user = await prisma.user.create({
            data: {
                chipId: body.cardChipId,
                accessCode: body.accessCode,
                tutorials: [
                    false, // TUTORIAL_ID_STORY = 0,
                    false, // TUTORIAL_ID_TIME_ATTACK = 1,
                    false, // TUTORIAL_ID_GHOST = 2,
                    false, // TUTORIAL_ID_GHOST_CHALLENGE = 3,
                    false, // TUTORIAL_ID_UNUSED_4 = 4,
                    false, // TUTORIAL_ID_UNUSED_5 = 5,
                    false, // TUTORIAL_ID_GHOST_SEARCH = 6,
                    false, // TUTORIAL_ID_GHOST_COMPETITION = 7,
                    false, // TUTORIAL_ID_HP600_CARD = 8,
                    false, // TUTORIAL_ID_UNUSED_9 = 9,
                    false, // TUTORIAL_ID_COMPETITION_QUALIFIED = 10,
                    false, // TUTORIAL_ID_COMPETITION_TERMINAL = 11,
                    false, // TUTORIAL_ID_COMPETITION_NOTICE = 12,
                    false, // TUTORIAL_ID_COMPETITION_FINISHED = 13,
                    false, // TUTORIAL_ID_UNUSED_14 = 14,
                    false, // TUTORIAL_ID_UNUSED_15 = 15,
                    false, // TUTORIAL_ID_UNUSED_16 = 16,
                    false, // TUTORIAL_ID_UNUSED_17 = 17,
                    false, // TUTORIAL_ID_UNUSED_18 = 18,
                    false, // TUTORIAL_ID_UNUSED_19 = 19,
                    false, // TUTORIAL_ID_GHOST_STAMP = 20,
                    false, // TUTORIAL_ID_GHOST_STAMP_DECLINED = 21,
                    false, // TUTORIAL_ID_GHOST_STAMP_FRIENDS = 22,
                    false, // TUTORIAL_ID_TERMINAL_SCRATCH = 23,
                    false, // TUTORIAL_ID_TURN_SCRATCH_SHEET = 24,
                    false, // TUTORIAL_ID_INVITE_FRIEND_CAMPAIGN = 25,
                    false, // TUTORIAL_ID_CAR_COUPON_FULL_TUNED_RECEIVABLE = 26,
                    false, // TUTORIAL_ID_VS_CONTINUE_TICKET = 27,
                    false, // TUTORIAL_ID_UNUSED_28 = 28,
                    false, // TUTORIAL_ID_UNUSED_29 = 29,
                    false, // TUTORIAL_ID_UNUSED_30 = 30,
                    false, // TUTORIAL_ID_DRESS_UP = 31,
                    false, // TUTORIAL_ID_UNUSED_32 = 32,
                    false, // TUTORIAL_ID_STORY_NEW_FEATURE = 33,
                    false, // TUTORIAL_ID_GHOST_NEW_FEATURE = 34,
                    false, // TUTORIAL_ID_UNUSED_35 = 35,
                    false, // TUTORIAL_ID_GHOST_EXPEDITION_NEW = 36,
                    false, // TUTORIAL_ID_GHOST_EXPEDITION_WANTED = 37,
                    false, // TUTORIAL_ID_GHOST_EXPEDITION_WANTED2 = 38,
                    false, // TUTORIAL_ID_GHOST_EXPEDITION_REWARD = 39,
                    false, // TUTORIAL_ID_MULTI_GHOST_VS_2 = 40,
                    false, // TUTORIAL_ID_MULTI_GHOST_VS_3 = 41,
                    false, // TUTORIAL_ID_GHOST_SELECT_BY_OTHER_PLACE = 42,
                    false, // TUTORIAL_ID_GHOST_SELECT_BY_MANUFACTURER = 43,
                    false, // TUTORIAL_ID_GHOST_SELECT_BY_OTHER_MANUFACTURER = 44,
                    false, // TUTORIAL_ID_GHOST_SELECT_BY_PLAYED = 45,
                    false, // TUTORIAL_ID_GHOST_HIGHWAY_NEW = 46,
                    false, // TUTORIAL_ID_GHOST_HIGHWAY_STATION = 47,
                    false, // TUTORIAL_ID_GHOST_HIGHWAY_BOSS = 48,
                    false, // TUTORIAL_ID_GHOST_TROPHY = 49,
                    false, // TUTORIAL_ID_GHOST_SELECT = 50,
                    false, // TUTORIAL_ID_GHOST_SELECT_BY_SAME_PLACE = 51,
                    false, // TUTORIAL_ID_GHOST_BINGO_NEW = 52,
                    false, // TUTORIAL_ID_UNUSED_53 = 53,
                    false, // TUTORIAL_ID_GHOST_BINGO_LINK = 54,
                    false, // TUTORIAL_ID_GHOST_KOSHIEN_NEW = 55,
                    false, // TUTORIAL_ID_GHOST_KOSHIEN_NOTICE = 56,
                    false, // TUTORIAL_ID_GHOST_KOSHIEN_MVP_UPDATE = 57,
                    false, // TUTORIAL_ID_BINGO_LUCKY_CHANCE = 58,
                    false, // TUTORIAL_ID_GHOST_KOSHIEN_FINISHED = 59,
                    false, // TUTORIAL_ID_GHOST_KOSHIEN_AFTEREVENT = 60
                    false, // TUTORIAL_ID_GHOST_BINGO_AREA = 61
                ],
            }
        });

        console.log('user made');

        if(!user) 
        {
            msg.error = wmproto.wm.protobuf.ErrorCode.ERR_REQUEST;
        }

        // Give user full tune ticket
        let ftTicketGrant = Config.getConfig().gameOptions.grantFullTuneTicketToNewUsers;
        if(ftTicketGrant > 0) 
        {
            console.log(`Granting Full-Tune Ticket x${ftTicketGrant} to new user...`);

            for(let i=0; i<ftTicketGrant; i++) 
            {
                await prisma.userItem.create({
                    data: {
                        userId: user.id,
                        category: wmproto.wm.protobuf.ItemCategory.CAT_CAR_TICKET_FREE,
                        itemId: 5, 
                        type: 0 // Car Ticket
                    }
                });
            }

            console.log('Done!');
        }
    }
    // New card registration is not allowed / closed
    else
    {
        console.log('New card / user registration is closed');
        
        msg.error = wmproto.wm.protobuf.ErrorCode.ERR_REQUEST;
    }

    return { msg }
}


// Get User's Terminal Scratch Data
export async function getTerminalScratch(userId: number)
{
    // Get the number of scratch cards for the user
    let scratchSheetCount = await prisma.scratchSheet.count({
        where: {
            userId: userId
        }
    });

    console.log("Current sheet count:", scratchSheetCount);

    // If the user has no scratch sheets
    if (scratchSheetCount == 0)
    {
        console.log("Generating first sheet ...");

        // Generate a new scratch sheet for the user
        await scratch.generateScratchSheet(userId, 1);

        // Set the current scratch sheet to 1
        await prisma.user.update({
            where: {
                id: userId
            }, 
            data: {
                currentSheet: 1
            }
        });
    }
}


// Check User's Car Order
export async function getCarOder(user: any)
{
    // If the car order array has not been created
    if (user.carOrder.length > 0)
    {
        // Sort the player's car list using the car order property
        user.cars = user.cars.sort(function(a: any, b: any)
        {
            // User, and both car IDs exist
            if (user)
            {
                // Compare both values using the car order array
                let compare: number = user?.carOrder.indexOf(a!.carId) - user?.carOrder.indexOf(b!.carId);

                // Return the comparison
                return compare;
            }
            else // Car IDs not present in car order list
            {
                throw Error("UserNotFoundException");
            }
        });
    }
    else // Car order undefined
    {
        // We will define it here
        let carOrder : number[] = [];

        // Loop over all of the user cars
        for(let car of user.cars)
        {
            // Add the car id to the list
            carOrder.push(car.carId);
        }

        // Update the car id property for the user
        await prisma.user.update({
            where: {
                id: user.id
            }, 
            data: {
                carOrder: carOrder
            }
        })
    }
}


// Check User's Car Window Sticker
export async function checkWindowSticker(userCar: any, userId: number)
{
    // Default value for windowStickerString and windowStickerFont
    let wsString = 'ＷＡＮＧＡＮ';
    let wsFont = 0;

    // user.cars found
    if(userCar.length > 0)
    {
        // User atleast have 1 car
        if(userCar[0]?.windowStickerString !== null && userCar[0]?.windowStickerString !== undefined && 
            userCar[0]?.windowStickerString !== '')
        {
            wsString = userCar[0].windowStickerString;
            wsFont = userCar[0].windowStickerFont;
        }
        // else{} User don't have a car... returning default windowStickerString and windowStickerFont value

        // Check if last played id is null
        if(userCar[0].lastPlayedPlaceId === null || userCar[0].lastPlayedPlaceId === undefined)
        {
            for(let i=0; i<userCar.length; i++)
            {
                userCar[0].lastPlayedPlaceId = 1;
            }
            
            await prisma.car.updateMany({
                where:{
                    userId: userId
                },
                data:{
                    lastPlayedPlaceId: 1
                }
            });
        }
    }

    return { wsString, wsFont }
}


// Check Competition (OCM) Participation State
export async function competitionParticipation(msgCars: any, carStates: any)
{
    // Competition (OCM) Participation Counter (just for console.log stuff, not really important)
    let ParticipationMainDrawCounter = 0;
    let ParticipationQualifyingCounter = 0;
    let ParticipationFinalCounter = 0;

    // Get the current date/time (unix epoch)
    let date = Math.floor(new Date().getTime() / 1000);

    // Get current active Competiton (OCM) Event
    let ghostCompetitionSchedule = await prisma.oCMEvent.findFirst({
        where: {
            // qualifyingPeriodStartAt is less than current date
            qualifyingPeriodStartAt: { lte: date },

            // competitionEndAt is greater than current date
            competitionEndAt: { gte: date },
        }
    });

    if(ghostCompetitionSchedule)
    {
        // Check each car record
        for(let i=0; i<msgCars.length; i++)
        {
            // Current date is OCM main draw
            if(ghostCompetitionSchedule.competitionStartAt < date && ghostCompetitionSchedule.competitionCloseAt > date)
            {
                // Check ocm play record
                let checkParticipation = await prisma.oCMPlayRecord.findFirst({
                    where:{
                        carId: msgCars[i].carId,
                        competitionId: ghostCompetitionSchedule.competitionId,
                    }
                });

                // Record found
                if(checkParticipation)
                {
                    ParticipationMainDrawCounter++

                    // Check Car State
                    // Get OCM Data
                    let ocmTallyRecord = await prisma.oCMTally.findFirst({ 
                        where:{
                            carId: msgCars[i].carId,
                            competitionId: ghostCompetitionSchedule.competitionId,
                        }
                    });

                    if(ocmTallyRecord)
                    {
                        carStates[i].eventJoined = true;
                        carStates[i].competitionState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_QUALIFIED
                    }	
                }
                else
                {
                    carStates[i].eventJoined = false;
                    carStates[i].competitionState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_NOT_PARTICIPATED
                }
            }
            // Current date is OCM qualifying day
            else if(ghostCompetitionSchedule.qualifyingPeriodStartAt < date && ghostCompetitionSchedule.qualifyingPeriodCloseAt > date)
            {
                // Check ocm play record
                let checkParticipation = await prisma.oCMPlayRecord.findFirst({
                    where:{
                        carId: msgCars[i].carId,
                        competitionId: ghostCompetitionSchedule.competitionId,
                    }
                });

                // Record found
                if(checkParticipation)
                {
                    ParticipationQualifyingCounter++

                    // Check Car State
                    // Get OCM Data
                    let ocmRecord = await prisma.oCMPlayRecord.findFirst({ 
                        where:{
                            carId: msgCars[i].carId,
                            competitionId: ghostCompetitionSchedule.competitionId,
                            periodId: 0
                        },
                    });

                    if(ocmRecord)
                    {
                        carStates[i].eventJoined = true;
                        carStates[i].competitionState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_PARTICIPATED
                    }
                }
                else
                {
                    carStates[i].eventJoined = false;
                    carStates[i].competitionState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_NOT_PARTICIPATED
                }
            }
            // Current date is OCM ended
            else if(ghostCompetitionSchedule.competitionCloseAt < date && ghostCompetitionSchedule.competitionEndAt > date)
            {
                // Check ocm play record
                let checkParticipation = await prisma.oCMPlayRecord.findFirst({
                    where:{
                        carId: msgCars[i].carId,
                        competitionId: ghostCompetitionSchedule.competitionId,
                    }
                });

                // Record found
                if(checkParticipation)
                {
                    ParticipationFinalCounter++

                    // Check Car State
                    // Get OCM Data
                    let ocmTallyRecord = await prisma.oCMTally.findFirst({ 
                        where:{
                            carId: msgCars[i].carId,
                            competitionId: ghostCompetitionSchedule.competitionId,
                            periodId: 999999999
                        },
                    });

                    if(ocmTallyRecord)
                    {
                        carStates[i].eventJoined = true;
                        carStates[i].competitionState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_QUALIFIED
                    }
                }
                else
                {
                    carStates[i].eventJoined = false;
                    carStates[i].competitionState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_NOT_PARTICIPATED
                }
            }
        }
    }

    // Check Competition (OCM) HoF Ghost Registered from Terminal for each car record
    for(let i=0; i<msgCars.length; i++)
    {
        let checkRegisteredGhost = await prisma.ghostRegisteredFromTerminal.findFirst({
            where:{
                carId: msgCars[i].carId,
            }
        });

        if(checkRegisteredGhost)
        {
            carStates[i].hasOpponentGhost = true;
        }
        else
        {
            carStates[i].hasOpponentGhost = false;
        }
    }

    // Get the competition state
    let competitionUserState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_NOT_PARTICIPATED;
    if(ParticipationMainDrawCounter > 0)
    {
        console.log('Competition (OCM) Participation : '+ParticipationMainDrawCounter+' car(s) Qualified');
        competitionUserState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_QUALIFIED
    }
    else if(ParticipationQualifyingCounter > 0)
    {
        console.log('Competition (OCM) Participation : '+ParticipationQualifyingCounter+' car(s) Participated');
        competitionUserState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_PARTICIPATED
    }
    else if(ParticipationFinalCounter > 0)
    {
        console.log('Competition (OCM) Participation : '+ParticipationFinalCounter+' car(s) played Competition (OCM) Event');
        competitionUserState = wmproto.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_WON
    }
    else if(ghostCompetitionSchedule)
    {
        console.log('Competition (OCM) Participation : Not Participated / Qualified');
    }
    else
    {
        console.log('No Competition (OCM) Event Available');
    }

    return { competitionUserState }
}
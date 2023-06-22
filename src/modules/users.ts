import { Application } from "express";
import { Config } from "../config";
import { Module } from "module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/wm.proto";

// Import Util
import * as common from "./util/common";
import * as userFunctions from "./users/functions";


export default class UserModule extends Module {
    register(app: Application): void {

        // Load user data when entering the game or after tapping the bannapass card
		app.post('/method/load_user', async (req, res) => {

            // Get the request body for the load user request
			let body = wm.wm.protobuf.LoadUserRequest.decode(req.body);

			// Trim Mojibake
			//let trimmedWord = common.trimMojibake(body.cardChipId);
			//body.cardChipId = trimmedWord;
			
			// Block blank card.ini data and vanilla TP blank card data
			if(body.cardChipId.match(/7F5C9744F11111114326.*/) || body.cardChipId.match(/0000000000.*/))
			{
				body.cardChipId = '';
				body.accessCode = '';
			}

            // Get the user from the database
			let user = await prisma.user.findFirst({
				where: {
					chipId: body.cardChipId,
					accessCode: body.accessCode
				},
				include: {
					cars: {
						include: {
							state: true,
							gtWing: true,
							lastPlayedPlace: true
						},
						where:{
							state: { toBeDeleted: false } // except deleted car
						}
					}
				}
			});

			// No user returned
			if (!user) 
			{
				console.log('no such user');

				let msg = {
					error: wm.wm.protobuf.ErrorCode.ERR_SUCCESS,
					numOfOwnedCars: 0,
					cars: [],
					spappState: wm.wm.protobuf.SmartphoneAppState.SPAPP_UNREGISTERED,
					transferState: wm.wm.protobuf.TransferState.NOT_REGISTERED,
				};

				if (!body.cardChipId || !body.accessCode) 
				{
					msg.error = wm.wm.protobuf.ErrorCode.ERR_USER_SUCCEEDED;

					// Encode the response
					let message = wm.wm.protobuf.LoadUserResponse.encode(msg);

					// Send the response to the client
					common.sendResponse(message, res, req.rawHeaders);

					return;
				}

				// User not yet exist
				let userNotYetExist = await userFunctions.userNotYetExist(body, msg);
				msg = userNotYetExist.msg;

				// Encode the response
				let message = wm.wm.protobuf.LoadUserResponse.encode(msg);

				// Send the response to the client
				common.sendResponse(message, res, req.rawHeaders);

				return;
			}
			// else {} continue below

			// Get User's Terminal Scratch Data
			await userFunctions.getTerminalScratch(user!.id);

			// Check if car orde array is not created
			await userFunctions.getCarOder(user);

			// Get the states of the user's cars
			let carStates = user.cars.map(e => e.state);

			// Get all of the user's tickets
			let tickets = await prisma.userItem.findMany({
				where: {
					userId: user.id, 
					type: 0
				}, 
				select: {
					itemId: true, 
					category: true, 
					userItemId: true
				}
			})


			// Error handling if windowStickerString and windowStickerFont is undefined or null
			// when User is registering bannapass from terminal unit first instead of driver unit
			let checkWindowSticker = await userFunctions.checkWindowSticker(user.cars, user.id);
			let wsString = checkWindowSticker.wsString;
			let wsFont = checkWindowSticker.wsFont;

			// Change Ghost Stamp tutorial to true
			if(user.tutorials[20] === false)
			{
				console.log('Change Ghost Stamp tutorial to true');

				for(let i=20; i<25; i++)
				{
					user.tutorials[i] = true;
				}

				await prisma.user.update({
					where:{
						chipId: body.cardChipId
					},
					data:{
						tutorials: user.tutorials
					}
				});
			}
			

            // Response data
			let msg = {
				error: wm.wm.protobuf.ErrorCode.ERR_SUCCESS,
				
				// Bannapassport Data
				unlockAt: null,
				accessCode: null,
				banapassportAmId: 1,
				mbid: 1,
				userId: user.id,

				// 5 cars in-game, 200 cars on terminal
				numOfOwnedCars: user.cars.length,
				cars: user.cars.slice(0, body.maxCars), 
				carStates,

				// Ticket Owned
				unusedCarTickets: tickets,
				fullTunedCarTicket: true,

				// Tutorials Confirmed
				tutorials: user.tutorials,

				// Competition (OCM) participation
				competitionUserState: wm.wm.protobuf.GhostCompetitionParticipantState.COMPETITION_NOT_PARTICIPATED,

				// Set the window sticker string for all cars 
				windowStickerString: wsString, 
				windowStickerFont: wsFont,

				// Wangan Navi
				spappState: wm.wm.protobuf.SmartphoneAppState.SPAPP_BNID,

				// idk what this is
				transferState: wm.wm.protobuf.TransferState.TRANSFERRED,
				wasCreatedToday: false,

				// Invite Friend Campaign Event
				participatedInInviteFriendCampaign: false
			}

			
			// Check Competition (OCM) Car Participation State
			let competitionParticipation = await userFunctions.competitionParticipation(msg.cars, carStates);
			msg.competitionUserState = competitionParticipation.competitionUserState;

            // Response data if user is banned
			if (user.userBanned) 
			{
				msg.error = wm.wm.protobuf.ErrorCode.ERR_ID_BANNED;
			}

            // Encode the response
			let message = wm.wm.protobuf.LoadUserResponse.encode(msg);

            // Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
		})


        // Create User Request
        app.post('/method/create_user', async (req, res) => {

			// This request is sent by the terminal when you
			// select 'yes' to register on the starting menu
			// if you have not created your account yet.

			// However, we don't really need to process it as 
			// the load_user command already creates the user.
			// we do, however need to send a valid response 
			// otherwise the terminal crashes.

			// Get the request body for the create user request
			let body = wm.wm.protobuf.CreateUserRequest.decode(req.body);

			// Trim Mojibake
			//let trimmedWord = common.trimMojibake(body.cardChipId);
			//body.cardChipId = trimmedWord;

			// Get the user info via the card chip id
			let user = await prisma.user.findFirst({
				where: {
					chipId: body.cardChipId,
					accessCode: body.accessCode
				}
			});

			// Message object
			let msg;

			// User exists
			if (user)
			{
                msg = {
                    // Success error message
                    error : wm.wm.protobuf.ErrorCode.ERR_SUCCESS,

                    // User's user id
                    userId : user?.id
                }
			}
			else // User does not exist
			{
                msg = {
                    // User not found error message
                    error : wm.wm.protobuf.ErrorCode.ERR_NOT_FOUND, 

                    // No user id
                    userId : 0
                }
			}

			// Generate the response for the create user request
			let message = wm.wm.protobuf.CreateUserResponse.encode(msg);

            // Send response to client
            common.sendResponse(message, res, req.rawHeaders);
		});


        // Load Drive Information
        app.post('/method/load_drive_information', async (req, res) => {

            // Get the request body for the load drive information request
			let body = wm.wm.protobuf.LoadDriveInformationRequest.decode(req.body);
			
			// Get all of the user's tickets
			let tickets = await prisma.userItem.findMany({
				where: {
					userId: body.userId, 
					type: 0
				}, 
				select: {
					itemId: true, 
					category: true, 
					userItemId: true 
				}
			})

            // TODO: Add notices to config
			let notice = (Config.getConfig().notices || []);

            // Create the notice window objects
			let noticeWindows = notice.map(a => wm.wm.protobuf.NoticeEntry.NOTICE_UNUSED_1);

            // Response data
            let msg = {
                error: wm.wm.protobuf.ErrorCode.ERR_SUCCESS,	
				noticeWindow: noticeWindows,
				noticeWindowMessage: notice,
				transferNotice: {
					needToSeeTransferred: false,
					totalMaxiGold: 0,
					numOfPorscheCars: 0,
					porscheModels: [],
					hasR35: false,
				},
				restrictedModels: [],
				announceFeature: false,
				announceMobile: false,
				availableTickets: tickets,
            }

            // Encode the response
            let message = wm.wm.protobuf.LoadDriveInformationResponse.encode(msg);
            
            // Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
        })

        
        // Update User Session
		app.post('/method/update_user_session', (req, res) => {

			// Response data
            let msg = {
                error: wm.wm.protobuf.ErrorCode.ERR_SUCCESS,
            }

			// Encode the response
            let message = wm.wm.protobuf.UpdateUserSessionResponse.encode(msg);

            // Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
        })


        /*
        // Start Transfer
        app.post('/method/start_transfer', (req, res) => {

			// Get the information from the request
			let body = wm.wm.protobuf.StartTransferRequest.decode(req.body);

			// Response data
            let msg = {
				error: wmsrv.wm.protobuf.ErrorCode.ERR_SUCCESS,
			};

            // Encode the response
			let message = wmsrv.wm.protobuf.StartTransferResponse.encode(msg);

			// Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
        });


        // Grant Car Right
        app.post('/method/grant_car_right', (req, res) => {

			// Get the information from the request
			let body = wm.wm.protobuf.GrantCarRightRequest.decode(req.body);

			// Response data
            let msg = {
				error: wmsrv.wm.protobuf.ErrorCode.ERR_SUCCESS,
			};

            // Encode the response
			let message = wmsrv.wm.protobuf.GrantCarRightResponse.encode(msg);

			// Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
        });


        // Ask Access Code
        app.post('/method/ask_access_code', (req, res) => {

			// Get the information from the request
			let body = wm.wm.protobuf.AskAccessCodeRequest.decode(req.body);

			// Response data
            let msg = {
				error: wmsrv.wm.protobuf.ErrorCode.ERR_SUCCESS,
			};

            // Encode the response
			let message = wmsrv.wm.protobuf.AskAccessCodeResponse.encode(msg);

			// Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
        });

        
        // Participate In Invite Friend Campaign
        app.post('/method/participate_in_invite_friend_campaign', (req, res) => {

			// Get the information from the request
			let body = wm.wm.protobuf.ParticipateInInviteFriendCampaignRequest.decode(req.body);

			// Response data
            let msg = {
				error: wmsrv.wm.protobuf.ErrorCode.ERR_SUCCESS,
			};

            // Encode the response
			let message = wmsrv.wm.protobuf.ParticipateInInviteFriendCampaignResponse.encode(msg);

			// Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
        });


		app.post('/method/consume_user_item', async (req, res) => {

			// Get the information from the request
			let body = wm.wm.protobuf.ConsumeUserItemRequest.decode(req.body);

			// Response data
            let msg = {
				error: wmsrv.wm.protobuf.ErrorCode.ERR_SUCCESS,
			};

            // Encode the response
			let message = wmsrv.wm.protobuf.ConsumeUserItemResponse.encode(msg);

			// Send the response to the client
            common.sendResponse(message, res, req.rawHeaders);
		})
        */
    }
}

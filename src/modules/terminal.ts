import { Application } from "express";
import { Config } from "../config";
import { Module } from "module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/v388.proto";
import * as wmsrv from "../wmmt/service.proto";

// Import Util
import * as common from "./util/common";


export default class TerminalModule extends Module {
    register(app: Application): void {

		// Car Summary Request (for bookmarks, also for search ghost by name)
		app.get('/resource/car_summary', async (req, res) => {

			// Get the query from the request
			let query = req.query;
			let cars;

			// Check the query limit
			let queryLimit = 10
			if(query.limit)
			{
				queryLimit = Number(query.limit);
			}

			// Check the last played place id
			if(query.last_played_place_id)
			{
				let queryLastPlayedPlaceId = 1;
				let getLastPlayedPlaceId = await prisma.placeList.findFirst({
					where:{
						placeId: String(query.last_played_place_id)
					}
				})

				if(getLastPlayedPlaceId)
				{
					queryLastPlayedPlaceId = getLastPlayedPlaceId.id;
				}

				cars = await prisma.car.findMany({
					take: queryLimit, 
					where: {
						lastPlayedPlaceId: queryLastPlayedPlaceId
					},
					include:{
						gtWing: true,
						lastPlayedPlace: true
					}
				});
			}
			else
			{
				// Get all of the cars matching the query
				cars = await prisma.car.findMany({
					take: queryLimit, 
					where: {
						OR:[
							{
								name: {
									startsWith: String(query.name)
								}
							},
							{
								name: {
									endsWith: String(query.name)
								}
							}
						]
						
					},
					include:{
						gtWing: true,
						lastPlayedPlace: true
					}
				});
			}

			// Check if regionId is 0
			for(let i=0; i<cars.length; i++)
			{
				// Change to other value if regionId is 0
				if(cars[i].regionId === 0)
				{
					let randomRegionId = Math.floor(Math.random() * 47) + 1;
					cars[i].regionId = randomRegionId;
				}
			}
			
			// Response data
			let msg = {
				hitCount: cars.length,
				cars: cars
			}

			// Encode the response
			let message = wmsrv.v388.protobuf.CarSummary.encode(msg);

			// Send the response to the client
            common.sendResponse(message, res);
		})


		// Save upon timeout / exit terminal
		app.post('/method/save_terminal_result', async (req, res) => {

			// Get the contents from the request
			let body = wm.v388.protobuf.SaveTerminalResultRequest.decode(req.body);

			// user id is required field
			let user = await prisma.user.findFirst({
				where: { 
					id: body.userId 
				},
			});

			if(user)
			{
				// If the car order was modified
				// Update the car order in the table
				if (body.carOrder.length > 0)
				{
					await prisma.user.update({
						where: {
							id: body.userId
						},
						data: {
							carOrder: body.carOrder
						}
					});
				}
			}

			// Response data
			let msg = {
				error: wm.v388.protobuf.ErrorCode.ERR_SUCCESS,
			}

			// Encode the response
			let message = wm.v388.protobuf.SaveTerminalResultResponse.encode(msg);

			// Send the response to the client
            common.sendResponse(message, res);
		})
    }	
}
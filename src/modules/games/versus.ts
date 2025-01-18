import { prisma } from "../..";

// Import Proto
import { v388 } from "../../wmmt/v388.proto";

// Import Util
import * as common from "../util/common";


// Save versus battle result
export async function saveVersusBattleResult(body: v388.protobuf.SaveGameResultRequest, car: any)
{
    // Not retired
    if (!(body.retired)) 
    {
        // Get the vs result for the car
        let vsResult = body?.vsResult;

        // vs result is set
        if (vsResult)
        {
            console.log(vsResult);

            // vs result update data
            let data : any = {
                vsPlayCount: common.sanitizeInput(vsResult.vsPlayCount), 
                vsBurstCount: common.sanitizeInput(vsResult.vsBurstCount), 
                vsStarCount: common.sanitizeInputNotZero(vsResult.vsStarCount), 
                vsCoolOrWild: common.sanitizeInput(vsResult.vsCoolOrWild),
                vsSmoothOrRough: common.sanitizeInput(vsResult.vsSmoothOrRough) 
            }

            // If the current versus star count is greater than the maximum
            if (data.vsStarCount && (car.vsStarCountMax < data.vsStarCount))
            {
                // Update the maximum versus star count
                data.vsStarCountMax = data.vsStarCount;
            }

            await prisma.car.update({
                where: {
                    carId: body.carId
                },
                data: data
            });
        }
    }
}
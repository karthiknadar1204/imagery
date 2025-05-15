import { supabase } from "@/supabase_client";
import { NextResponse } from "next/server";
import Replicate from "replicate"
const replicate = new Replicate({
    auth: `${process.env.REPLICATE_API_TOKEN}`,
});

export async function POST(req, res) {
    try {
        const { imageUrl, command, canvas, userId } = await req.json()
        console.log('Edit request received:', { imageUrl, command, canvas, userId });

        // Validate the image URL
        if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error('Invalid image URL provided');
        }

        // Check if the image URL is accessible
        try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error(`Image URL is not accessible: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Image URL validation error:', error);
            throw new Error('Failed to validate image URL. Please try again with a different image.');
        }

        const details = command == "Remove Background" ? {
            version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            input: {
                image: imageUrl
            }
        } : command == "upscale" ? {
            version: "350d32041630ffbe63c8352783a26d94126809164e54085352f8326e53999085",
            input: {
                image: imageUrl,
                scale: 2,
                face_enhance: true,
            }
        } : command == "captionize" ? {
            version: "2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
            input: {
                task: "image_captioning",
                image: imageUrl
            }
        } : command == "restore faces" ? {
            version: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
            input: {
                image: imageUrl,
                upscale: 2,
                face_upsample: true,
                background_enhance: true,
                codeformer_fidelity: 0.1
            }
        } : command == "restore old photo" ? {
            version: "c75db81db6cbd809d93cc3b7e7a088a351a3349c9fa02b6d393e35e0d51ba799",
            input: {
                image: imageUrl,
                HR: false,
                with_scratch: false,
            }
        } : null;

        if (!details) {
            throw new Error(`Invalid command: ${command}`);
        }

        console.log('Starting Replicate prediction with details:', details);
        const startResponse = await replicate.predictions.create(details);
        let Response_Id = startResponse.id;
        console.log('Prediction started with ID:', Response_Id);

        let output = null;
        let attempts = 0;
        const maxAttempts = 20; // 1 minute timeout (20 * 3 seconds)

        while (!output && attempts < maxAttempts) {
            attempts++;
            let finalResponse = await replicate.predictions.get(Response_Id);
            console.log(`Attempt ${attempts}: Prediction status:`, finalResponse.status);

            if (finalResponse.status === "succeeded") {
                output = finalResponse.output;
                console.log('Prediction succeeded with output:', output);
                
                // Validate the output URL
                if (typeof output === 'string' && output.startsWith('http')) {
                    try {
                        const response = await fetch(output, { method: 'HEAD' });
                        if (!response.ok) {
                            throw new Error(`Output image URL is not accessible: ${response.status}`);
                        }
                    } catch (error) {
                        console.error('Output URL validation error:', error);
                        throw new Error('Failed to validate output image URL. Please try again.');
                    }
                }
            } else if (finalResponse.status === "failed") {
                console.error('Prediction failed:', finalResponse.error);
                throw new Error(`Prediction failed: ${finalResponse.error || 'Unknown error'}`);
            } else {
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }

        if (!output) {
            throw new Error('Prediction timed out');
        }

        // Prepare the data for Supabase
        const insertData = command === "captionize" 
            ? {
                canvas_id: canvas,
                url: imageUrl,
                caption: output.split(":")[1],
                user_id: userId
            }
            : {
                canvas_id: canvas,
                url: output,
                user_id: userId
            };

        console.log('Inserting into Supabase:', insertData);
        const { data, error } = await supabase
            .from("images_edited")
            .insert([insertData])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(`Failed to save edited image: ${error.message}`);
        }

        console.log('Successfully saved to Supabase:', data);
        return NextResponse.json(output);
    }
    catch (error) {
        console.error('Edit route error:', error);
        return NextResponse.json(
            { error: error.message || 'An error occurred during image editing' },
            { status: 400 }
        );
    }
}
import { supabase } from "@/supabase_client";
import { NextResponse } from "next/server";
import Replicate from "replicate"

const replicate = new Replicate({
    auth: `${process.env.REPLICATE_API_TOKEN}`,
});

export async function POST(req, res) {
    try {
        const { imageUrl, prompt, canvas, userId } = await req.json()
        console.log('Image to Image Edit request received:', { imageUrl, prompt, canvas, userId });

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

        const input = {
            steps: 50,
            prompt: prompt,
            guidance: 7,
            control_image: imageUrl,
            output_format: "jpg",
            safety_tolerance: 2,
            prompt_upsampling: false
        };

        console.log('Starting Replicate prediction with input:', input);
        const prediction = await replicate.predictions.create({
            version: "black-forest-labs/flux-depth-pro",
            input: input
        });

        let output = null;
        let attempts = 0;
        const maxAttempts = 20; // 1 minute timeout (20 * 3 seconds)

        while (!output && attempts < maxAttempts) {
            attempts++;
            let finalResponse = await replicate.predictions.get(prediction.id);
            console.log(`Attempt ${attempts}: Prediction status:`, finalResponse.status);

            if (finalResponse.status === "succeeded") {
                output = finalResponse.output;
                console.log('Prediction succeeded with output:', output);
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

        // The output is an array with a single URL string
        const transformedImageUrl = Array.isArray(output) ? output[0] : output;
        
        if (!transformedImageUrl || typeof transformedImageUrl !== 'string') {
            throw new Error('Invalid output format from image transformation');
        }

        // Prepare the data for Supabase
        const insertData = {
            canvas_id: canvas,
            url: transformedImageUrl,
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
        return NextResponse.json({ url: transformedImageUrl });
    }
    catch (error) {
        console.error('Image to Image Edit route error:', error);
        return NextResponse.json(
            { error: error.message || 'An error occurred during image transformation' },
            { status: 400 }
        );
    }
} 
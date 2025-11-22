import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get image details from database
    const { data: imageData, error: imageError } = await supabase
      .from('xray_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (imageError || !imageData) {
      throw new Error('Image not found');
    }

    // Get signed URL for the image
    const { data: urlData } = await supabase.storage
      .from('xray-images')
      .createSignedUrl(imageData.file_path, 3600);

    if (!urlData?.signedUrl) {
      throw new Error('Failed to get image URL');
    }

    // First, validate if this is an X-ray image
    const validationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a medical image validator. Your task is to determine if an image is a chest X-ray. Respond with ONLY "YES" if it is a chest X-ray, or "NO: [reason]" if it is not.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Is this a chest X-ray image? Answer with YES or NO: [reason]' },
              { type: 'image_url', image_url: { url: urlData.signedUrl } }
            ]
          }
        ],
      }),
    });

    if (!validationResponse.ok) {
      console.error('Validation request failed:', validationResponse.status);
      
      if (validationResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again in a moment.'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (validationResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: 'AI service temporarily unavailable. Please contact support.'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to validate image with AI service');
    }

    const validationData = await validationResponse.json();
    const validationResult = validationData.choices[0].message.content.trim();

    if (!validationResult.startsWith('YES')) {
      return new Response(
        JSON.stringify({
          isValid: false,
          reason: validationResult.replace('NO:', '').trim() || 'This image does not appear to be a chest X-ray.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If valid, perform detailed analysis
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert radiologist AI assistant. Analyze chest X-rays and provide detailed findings in JSON format.

Return a JSON object with this exact structure:
{
  "findings": [
    {
      "condition": "name of condition",
      "confidence": 0-100,
      "severity": "low" | "medium" | "high",
      "location": "specific anatomical location",
      "size": "size description if applicable",
      "details": "detailed description of what is observed"
    }
  ],
  "overallRisk": "low" | "medium" | "high",
  "recommendation": "detailed clinical recommendation",
  "summary": "comprehensive summary of findings"
}

Analyze for: Atelectasis, Consolidation, Infiltration, Pneumothorax, Edema, Emphysema, Fibrosis, Effusion, Pneumonia, Pleural Thickening, Cardiomegaly, Nodule, Mass, Hernia, Lung Lesion, Fracture, Lung Opacity, Enlarged Cardiomediastinum.

Be specific about locations (upper/middle/lower lobe, left/right, etc.), sizes (in cm if measurable), and characteristics.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this chest X-ray and provide detailed findings in JSON format.' },
              { type: 'image_url', image_url: { url: urlData.signedUrl } }
            ]
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Analysis error:', analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again in a moment.'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: 'AI service temporarily unavailable. Please contact support.'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to analyze image with AI service');
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.choices[0].message.content;
    
    // Extract JSON from the response (handle markdown code blocks)
    let analysisResult;
    try {
      const jsonMatch = analysisContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       analysisContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisContent;
      analysisResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse analysis JSON:', e);
      throw new Error('Failed to parse analysis results');
    }

    // Map findings to database score fields
    const scores: any = {
      atelectasis_score: 0,
      consolidation_score: 0,
      infiltration_score: 0,
      pneumothorax_score: 0,
      edema_score: 0,
      emphysema_score: 0,
      fibrosis_score: 0,
      effusion_score: 0,
      pneumonia_score: 0,
      pleural_thickening_score: 0,
      cardiomegaly_score: 0,
      nodule_score: 0,
      mass_score: 0,
      hernia_score: 0,
      lung_lesion_score: 0,
      fracture_score: 0,
      lung_opacity_score: 0,
      enlarged_cardiomediastinum_score: 0,
    };

    // Map findings to scores (convert percentage to decimal 0-1)
    analysisResult.findings.forEach((finding: any) => {
      const condition = finding.condition.toLowerCase().replace(/\s+/g, '_');
      const scoreField = `${condition}_score`;
      if (scores.hasOwnProperty(scoreField)) {
        scores[scoreField] = finding.confidence / 100; // Convert 0-100 to 0-1
      }
    });

    // Store analysis results in database
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('analysis_results')
      .insert({
        xray_image_id: imageId,
        user_id: imageData.user_id,
        ...scores,
        overall_risk: analysisResult.overallRisk,
        recommendation: analysisResult.recommendation,
        status: 'completed',
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Database error:', analysisError);
      throw new Error('Failed to store analysis results');
    }

    return new Response(
      JSON.stringify({
        isValid: true,
        analysisId: analysisRecord.id,
        findings: analysisResult.findings,
        overallRisk: analysisResult.overallRisk,
        recommendation: analysisResult.recommendation,
        summary: analysisResult.summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-xray function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials");
    }

    // Create Supabase client with service role key for admin operations
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.4");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const now = new Date().toISOString();

    // Find all active auctions that have ended
    const { data: endedAuctions, error: fetchError } = await supabase
      .from("bikes")
      .select("*")
      .eq("status", "active")
      .lt("end_time", now);

    if (fetchError) {
      throw new Error(`Failed to fetch ended auctions: ${fetchError.message}`);
    }

    if (!endedAuctions || endedAuctions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No auctions to close",
          closedCount: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Process each ended auction
    const results = [];
    for (const auction of endedAuctions) {
      // Get the highest bid for this auction
      const { data: highestBid } = await supabase
        .from("bids")
        .select("*")
        .eq("bike_id", auction.id)
        .order("amount", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Close the auction with or without a winner
      const updateData: any = { status: "closed" };

      // If there's a winning bid, set the winner
      if (highestBid) {
        updateData.winner_id = highestBid.bidder_id;
      }

      const { error: updateError } = await supabase
        .from("bikes")
        .update(updateData)
        .eq("id", auction.id);

      if (updateError) {
        results.push({
          auctionId: auction.id,
          title: auction.title,
          success: false,
          error: updateError.message,
        });
      } else {
        results.push({
          auctionId: auction.id,
          title: auction.title,
          success: true,
          winnerId: updateData.winner_id || null,
          winningBid: highestBid?.amount || null,
        });
      }
    }

    // Log results (in production, you'd want to send emails/notifications)
    console.log("Auction closing results:", JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${endedAuctions.length} ended auctions`,
        closedCount: endedAuctions.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in close-auctions function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

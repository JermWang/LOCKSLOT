import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth-server'
import { rateLimitGate } from '@/lib/api-guard'

export const runtime = 'nodejs'

// Get username for a wallet
export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: 'username_get', windowMs: 10_000, max: 60 })
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data: user } = await supabase
      .from('users')
      .select('username')
      .eq('wallet_address', walletAddress)
      .single()
    
    return NextResponse.json({ 
      username: user?.username || null 
    })
    
  } catch (error) {
    console.error('Get username error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Set or update username
export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitGate(request, { id: 'username_post', windowMs: 10_000, max: 10 })
    if (limited) return limited

    const { walletAddress, username, auth } = await request.json()
    
    if (!walletAddress || !username || !auth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate username
    const cleanUsername = username.trim()
    
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 })
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 })
    }
    
    const authResult = verifyAuth({
      action: "set_username",
      walletAddress,
      payload: { username: cleanUsername },
      auth,
    })
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }
    
    const supabase = createServerClient()
    
    // Check if username is taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', cleanUsername)
      .neq('wallet_address', walletAddress)
      .single()
    
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }
    
    // Get or create user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress, username: cleanUsername, balance: 0 })
        .select()
        .single()
      
      if (createError) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      user = newUser
    } else {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: cleanUsername, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      
      if (updateError) {
        return NextResponse.json({ error: 'Failed to update username' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      success: true,
      username: cleanUsername 
    })
    
  } catch (error) {
    console.error('Set username error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

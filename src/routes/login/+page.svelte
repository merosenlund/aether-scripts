<script lang="ts">
  let { data, form } = $props();
  let isSignUp = $state(false);
</script>

<div class="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
  <div class="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md dark:bg-zinc-900">
    <h1 class="text-2xl font-bold text-center">Aether Scripts</h1>
    <h2 class="text-lg text-center text-zinc-500">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
    
    {#if form?.error}
      <div class="p-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
        {form.error}
      </div>
    {/if}

    <form method="POST" action={isSignUp ? "?/register" : "?/login"} class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input type="email" name="email" id="email" required class="w-full p-2 mt-1 border rounded bg-zinc-50 dark:bg-zinc-800" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium">Password</label>
        <input type="password" name="password" id="password" required class="w-full p-2 mt-1 border rounded bg-zinc-50 dark:bg-zinc-800" />
      </div>
      <button type="submit" class="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </button>
    </form>

    <div class="text-sm text-center text-zinc-500 mt-4">
      {#if isSignUp}
        Already have an account? 
        <button class="text-blue-600 hover:underline" onclick={() => isSignUp = false}>Sign in</button>
      {:else}
        Don't have an account? 
        <button class="text-blue-600 hover:underline" onclick={() => isSignUp = true}>Sign up</button>
      {/if}
    </div>
  </div>
</div>


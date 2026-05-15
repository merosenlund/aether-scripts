<script lang="ts">
  let { data } = $props();
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold">Reader Dashboard</h1>
  <p>Welcome, {data.session?.user.email}!</p>

  <form method="POST" action="?/logout" class="mt-4">
    <button type="submit" class="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700">
      Sign Out
    </button>
  </form>
</div>

<template>
  <div class="hello">
    <button @click="login" v-if="!session">Login</button>

    <template v-if="session">
      Session Auth: {{ session.auth }} <br/><br/>
      <button @click="transfer">Transfer</button>
      <button @click="logout">Logout</button>
    </template>
  </div>
</template>

<script>
import { ConnectWallet } from '@protonprotocol/proton-web-sdk'

// Constants
const appIdentifier = 'taskly'

export default {
  name: 'HelloWorld',

  data () {
    return {
      link: undefined,
      session: undefined
    }
  },

  methods: {
    async createLink ({ restoreSession }) {
      const { link, session } = await ConnectWallet({
        linkOptions: {
          endpoints: ['https://proton.greymass.com'],
          restoreSession
        },
        transportOptions: {
          requestAccount: 'myprotonacc', // Your proton account
          requestStatus: true
        },
        selectorOptions: {
          appName: 'Taskly',
          appLogo: 'https://taskly.protonchain.com/static/media/taskly-logo.ad0bfb0f.svg'
        }
      })
      this.link = link
      this.session = session
    },

    async login () {
      // Create link
      await this.createLink({ restoreSession: false })
      console.log('User authorization:', this.session.auth) // { actor: 'fred', permission: 'active }

      // Save auth for reconnection on refresh
      localStorage.setItem('saved-user-auth', JSON.stringify(this.session.auth))
    },

    async transfer () {
      // Send Transaction
      const result = await this.session.transact({
        transaction: {
          actions: [{
            // Token contract for XUSDT
            account: 'xtokens',
            // Action name
            name: 'transfer',
            // Action parameters
            data: {
              from: this.session.auth.actor,
              to: 'syed',
              quantity: '0.000001 XUSDT',
              memo: 'Tip!'
            },
            authorization: [this.session.auth]
          }]
        },
        broadcast: true
      })
      console.log('Transaction ID', result.processed.id)
    },

    async logout () {
      await this.link.removeSession(appIdentifier, this.session.auth)
      this.session = undefined
      localStorage.removeItem('saved-user-auth')
    },

    async reconnect () {
      // Restore session after refresh
      const saved = localStorage.getItem('saved-user-auth')

      if (saved) {
        // Create link if not exists
        if (!this.link) {
          await this.createLink({ restoreSession: true })
        }
      }
    }
  },

  created () {
    this.reconnect()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

const passport      = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const SlackStrategy  = require("passport-slack-oauth2").Strategy;
const { User, Plan } = require("../models");
const logger         = require("../utils/logger");

// ─── Serialise / Deserialise ───────────────────────────────────────
// Only used for session-based flows; JWT apps rarely need these,
// but kept here so OAuth callbacks that use sessions don't break.

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      include: [{ model: Plan, as: "plan" }],
    });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ─── Shared upsert helper ──────────────────────────────────────────

async function upsertOAuthUser({ provider, providerId, email, name, avatarUrl }) {
  // 1. Try to find by OAuth provider + ID
  let user = await User.findOne({
    where: { oauth_provider: provider, oauth_id: providerId },
  });

  if (user) {
    // Update profile info on every login
    await user.update({ name, avatar_url: avatarUrl, last_login_at: new Date() });
    return user;
  }

  // 2. Try to find by email (user may have signed up with password before)
  user = await User.findOne({ where: { email } });

  if (user) {
    await user.update({
      oauth_provider:  provider,
      oauth_id:        providerId,
      avatar_url:      avatarUrl,
      is_verified:     true,
      last_login_at:   new Date(),
    });
    return user;
  }

  // 3. Brand-new user — find free plan and create account
  const freePlan = await Plan.findOne({ where: { name: "free" } });

  user = await User.create({
    name,
    email,
    avatar_url:      avatarUrl,
    oauth_provider:  provider,
    oauth_id:        providerId,
    plan_id:         freePlan?.id ?? null,
    is_verified:     true,
    last_login_at:   new Date(),
  });

  logger.info(`New OAuth user created: ${email} via ${provider}`);
  return user;
}

// ─── Google ────────────────────────────────────────────────────────

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || "/api/oauth/google/callback",
      scope:        ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await upsertOAuthUser({
          provider:   "google",
          providerId: profile.id,
          email:      profile.emails?.[0]?.value,
          name:       profile.displayName,
          avatarUrl:  profile.photos?.[0]?.value,
        });
        done(null, user);
      } catch (err) {
        logger.error(`Google OAuth error: ${err.message}`);
        done(err, null);
      }
    }
  )
);

// ─── GitHub ────────────────────────────────────────────────────────

passport.use(
  new GitHubStrategy(
    {
      clientID:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:  process.env.GITHUB_CALLBACK_URL || "/api/oauth/github/callback",
      scope:        ["user:email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.find((e) => e.primary)?.value ??
          profile.emails?.[0]?.value;

        const user = await upsertOAuthUser({
          provider:   "github",
          providerId: profile.id,
          email,
          name:       profile.displayName || profile.username,
          avatarUrl:  profile.photos?.[0]?.value,
        });
        done(null, user);
      } catch (err) {
        logger.error(`GitHub OAuth error: ${err.message}`);
        done(err, null);
      }
    }
  )
);

// ─── Slack ─────────────────────────────────────────────────────────

passport.use(
  new SlackStrategy(
    {
      clientID:     process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      callbackURL:  process.env.SLACK_CALLBACK_URL || "/api/oauth/slack/callback",
      scope:        ["identity.basic", "identity.email", "identity.avatar"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await upsertOAuthUser({
          provider:   "slack",
          providerId: profile.id,
          email:      profile.user?.email,
          name:       profile.displayName,
          avatarUrl:  profile.user?.image_72,
        });
        done(null, user);
      } catch (err) {
        logger.error(`Slack OAuth error: ${err.message}`);
        done(err, null);
      }
    }
  )
);

module.exports = passport;

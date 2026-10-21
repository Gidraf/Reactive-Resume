require "tmpdir"

# Exercise the real lanes at the store SDK boundary without credentials or network calls.
class DistributionContract
  attr_reader :uploads

  def initialize
    @lanes = {}
    @uploads = []
    instance_eval(File.read(File.join(__dir__, "fastlane/Fastfile")), File.join(__dir__, "fastlane/Fastfile"))
  end

  def desc(_description); end

  def platform(name)
    @platform = name
    yield
  end

  def lane(name, &block)
    @lanes[[@platform, name]] = block
  end

  def publish(platform)
    instance_exec(&@lanes.fetch([platform, :upload]))
  end

  def app_store_connect_api_key(**_options)
    { fixture: true }
  end

  def upload_to_play_store(**options)
    @uploads << options
  end

  def upload_to_testflight(**options)
    @uploads << options
  end
end

module Supply
  class Client
    class << self
      attr_accessor :track_names, :read_error, :aborted

      def make_from_config
        new
      end
    end

    def begin_edit(package_name:)
      raise "Unexpected Play app" unless package_name == "me.rxresu"
      self.class.aborted = false
    end

    def tracks
      raise self.class.read_error if self.class.read_error
      self.class.track_names.map { |name| Struct.new(:track).new(name) }
    end

    def abort_current_edit
      self.class.aborted = true
    end
  end
end

module Spaceship
  module ConnectAPI
    class App
      class << self
        attr_accessor :groups

        def get(app_id:)
          raise "Unexpected App Store app" unless app_id == "6823975835"
          new
        end
      end

      def get_beta_groups
        self.class.groups
      end
    end
  end
end

module UI
  def self.user_error!(message)
    raise message
  end
end

ENV["RUNNER_TEMP"] = Dir.tmpdir
ENV["MOBILE_BUILD_NUMBER"] = "100"
%w[GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ASC_KEY_ID ASC_ISSUER_ID ASC_PRIVATE_KEY].each { |name| ENV[name] = "fixture" }
contract = DistributionContract.new
Supply::Client.track_names = ["production", "internal", "alpha", "beta", "closed-qa", "wear:production"]
contract.publish(:android)
play = contract.uploads.first
raise "Play release must reach internal testers" unless play[:track] == "internal" && play[:release_status] == "completed"
promotions = contract.uploads.drop(1)
raise "Every existing Play testing track must receive the build" unless
  promotions.map { |options| options[:track_promote_to] } == ["alpha", "beta", "closed-qa"]
raise "Promotions must use this exact binary and publish a completed release" unless promotions.all? { |options|
  options[:track] == "internal" && options[:version_code] == 100 &&
    options[:track_promote_release_status] == "completed" && options[:skip_upload_aab]
}
raise "Track discovery must close its read edit" unless Supply::Client.aborted

group = Struct.new(:id, :is_internal_group)
Spaceship::ConnectAPI::App.groups = [group.new("internal-team", true), group.new("external-beta", false), group.new("internal-qa", true)]
contract.publish(:ios)
testflight = contract.uploads.last
raise "TestFlight must wait and distribute" unless
  testflight[:skip_submission] == false && testflight[:skip_waiting_for_build_processing] == false
raise "Every existing TestFlight group must receive the build" unless
  testflight[:groups] == ["internal-team", "external-beta", "internal-qa"]
raise "External TestFlight testers require beta review and notification" unless
  testflight[:distribute_external] && testflight[:submit_beta_review] && testflight[:notify_external_testers] &&
    !testflight[:changelog].empty?

Spaceship::ConnectAPI::App.groups = [group.new("internal-team", true)]
contract.publish(:ios)
testflight = contract.uploads.last
raise "Internal-only TestFlight groups need no external beta review" unless
  testflight[:distribute_external] == false && testflight[:submit_beta_review] == false

Spaceship::ConnectAPI::App.groups = []
uploaded = contract.uploads.length
begin
  contract.publish(:ios)
  raise "Missing groups must prevent upload"
rescue RuntimeError => error
  raise unless error.message == "Configure a TestFlight testing group before publishing"
end
raise "Missing groups must not upload" unless contract.uploads.length == uploaded

Supply::Client.read_error = RuntimeError.new("Track discovery failed")
begin
  contract.publish(:android)
  raise "Track discovery errors must prevent promotions"
rescue RuntimeError => error
  raise unless error.message == "Track discovery failed"
end
raise "Track discovery failure must close its edit without promotions" unless
  Supply::Client.aborted && contract.uploads.length == uploaded + 1
puts "Distribution contracts passed"

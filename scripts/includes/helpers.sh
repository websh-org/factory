
error() {
  local red=`tput setaf 1`
  local bold=`tput bold`
  local reset=`tput sgr0`
  echo -e "${red}${bold}ERROR${reset} $*"
}

success() {
  local style="$(tput setaf 2)$(tput bold)"
  local reset=$(tput sgr0)
  echo "${style} OK ${reset} $*"
}

fatal() {
  local style="$(tput setaf 1)$(tput rev)$(tput bold)"
  local reset=$(tput sgr0)
  echo "${style} FATAL ${reset} $*"
  echo "Exiting."
  exit 1
}

parent_of_script() {
  echo $(readlink -f $(dirname $0)/..)
}

is_git_clean() {
  git diff-index --quiet HEAD
  return $?
}
ensure_git_clean() {
  is_git_clean || fatal "You have uncommitted changes.";
}

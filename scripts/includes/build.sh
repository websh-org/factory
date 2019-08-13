
. "$(dirname "$0")/includes/helpers.sh"

ROOT=$(parent_of_script)
DIST=$ROOT/dist

cd $ROOT;

PACKAGE=$(json_get $ROOT/real.package.json name)
echo
heading "Bulding package $PACKAGE"



announce "Is the working directory clean?"
is_git_clean && ok || abort "Working directory must be clean.";

announce "Preparing the dist directory in $DIST"
{
  rm -rf $DIST;
  mkdir $DIST;
} && ok || abort;

announce "Copy README.md"
cp $ROOT/README.md $DIST && ok || abort

announce "Copy LICENSE.md"
cp $ROOT/LICENSE.md $DIST && ok || abort

announce "Copy real.package.json to dist/package.json"
cp $ROOT/real.package.json $DIST/package.json && ok || abort

# Build this particular package in the dist directory
## Customize as necessary.

build_package;
success "$PACKAGE built in $DIST"
success "$(tput bold)All done.$(tput sgr0)"

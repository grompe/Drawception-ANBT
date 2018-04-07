import re,subprocess

template = """#### [Script updated to %s](https://github.com/grompe/Drawception-ANBT#drawception-anbt-):

%s

"""

data = open("CHANGELOG.txt").read()
s = re.match("([\d\.]+?)\n(.+?)\n\n\d", data, re.DOTALL)

post = template % s.group(1, 2)

p = subprocess.Popen("clip", stdin=subprocess.PIPE)
p.stdin.write(post)
